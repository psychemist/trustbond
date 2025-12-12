// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SuretyBond.sol";
import "../script/Deploy.s.sol";

contract SuretyBondTest is Test {
    SuretyBond public suretyBond;
    MockUSDC public usdc;

    address public owner = address(1);
    address public oracle = address(2);
    address public treasury = address(3);
    address public insurancePool = address(4);
    address public sponsor = address(5);
    address public employer = address(6);
    address public worker = address(7);

    uint256 public constant BOND_AMOUNT = 50 * 1e6; // 50 USDC
    uint256 public constant WEEKLY_WAGE = 100 * 1e6; // 100 USDC

    function setUp() public {
        vm.startPrank(owner);

        // Deploy MockUSDC
        usdc = new MockUSDC();

        // Deploy SuretyBond
        suretyBond = new SuretyBond(
            address(usdc),
            treasury,
            insurancePool,
            oracle
        );

        // Mint USDC to sponsor and employer
        usdc.mint(sponsor, 1000 * 1e6); // 1000 USDC
        usdc.mint(employer, 1000 * 1e6); // 1000 USDC

        vm.stopPrank();
    }

    function test_VerifyWorker() public {
        vm.prank(oracle);
        suretyBond.verifyWorker(worker);

        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertTrue(w.isVerified);
        assertEq(w.trustScore, 100);
    }

    function test_StakeBond() public {
        // First verify worker
        vm.prank(oracle);
        suretyBond.verifyWorker(worker);

        // Sponsor stakes bond
        vm.startPrank(sponsor);
        usdc.approve(address(suretyBond), BOND_AMOUNT);
        suretyBond.stakeBond(worker, BOND_AMOUNT);
        vm.stopPrank();

        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertEq(w.bondAmount, BOND_AMOUNT);
    }

    function test_HireWorker() public {
        _setupVerifiedAndBondedWorker();

        // Employer hires worker
        vm.startPrank(employer);
        usdc.approve(address(suretyBond), WEEKLY_WAGE * 4);
        suretyBond.hireWorker(worker, WEEKLY_WAGE);
        vm.stopPrank();

        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertTrue(w.isEmployed);
        assertEq(w.employer, employer);
        assertEq(w.weeklyWage, WEEKLY_WAGE);
        assertEq(w.depositedSalary, WEEKLY_WAGE * 4);
    }

    function test_SubmitCheckIn() public {
        _setupEmployedWorker();

        // Oracle submits check-in
        vm.prank(oracle);
        suretyBond.submitCheckIn(worker, 85);

        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertEq(w.trustScore, 85);
        assertEq(w.weeklyCheckIns, 1);
    }

    function test_ReleaseWeeklyWage() public {
        _setupEmployedWorker();

        // Submit 5 check-ins
        for (uint i = 0; i < 5; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 80);
        }

        // Fast forward 7 days
        vm.warp(block.timestamp + 7 days);

        // Calculate expected amounts
        uint256 workerAmount = (WEEKLY_WAGE * 8500) / 10000;
        uint256 insuranceAmount = (WEEKLY_WAGE * 500) / 10000;
        uint256 protocolAmount = (WEEKLY_WAGE * 500) / 10000;
        uint256 rentSavingsAmount = (WEEKLY_WAGE * 500) / 10000;

        uint256 workerBalanceBefore = usdc.balanceOf(worker);

        // Oracle pushes wage
        vm.prank(oracle);
        suretyBond.releaseWeeklyWage(worker);

        // Verify transfers
        assertEq(usdc.balanceOf(worker), workerBalanceBefore + workerAmount);
        assertEq(usdc.balanceOf(insurancePool), insuranceAmount);
        assertEq(usdc.balanceOf(treasury), protocolAmount);

        // Verify rent savings added to worker state
        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertEq(w.rentSavings, rentSavingsAmount);
        assertEq(w.weeklyCheckIns, 0); // Reset
    }

    function test_AdminForceReleaseWage() public {
        _setupEmployedWorker();

        for (uint i = 0; i < 5; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 80);
        }

        vm.warp(block.timestamp + 7 days);

        uint256 workerBalanceBefore = usdc.balanceOf(worker);

        // Owner (admin) force releases wage
        vm.prank(owner);
        suretyBond.adminForceReleaseWage(worker);

        uint256 workerAmount = (WEEKLY_WAGE * 8500) / 10000;
        assertEq(usdc.balanceOf(worker), workerBalanceBefore + workerAmount);
    }

    function test_ReleaseWeeklyWage_Split85_5_5_5() public {
        _setupEmployedWorker();

        // Submit 5 check-ins
        for (uint i = 0; i < 5; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 80);
        }

        vm.warp(block.timestamp + 7 days);

        // Get breakdown
        (
            uint256 workerAmt,
            uint256 insAmt,
            uint256 protAmt,
            uint256 rentAmt
        ) = suretyBond.getWageBreakdown(worker);

        // Verify percentages
        assertEq(workerAmt, 85 * 1e6); // 85%
        assertEq(insAmt, 5 * 1e6); // 5%
        assertEq(protAmt, 5 * 1e6); // 5%
        assertEq(rentAmt, 5 * 1e6); // 5%
        assertEq(workerAmt + insAmt + protAmt + rentAmt, WEEKLY_WAGE);
    }

    function test_SlashBond() public {
        _setupEmployedWorker();

        uint256 employerBalanceBefore = usdc.balanceOf(employer);

        // Employer slashes bond
        vm.prank(employer);
        suretyBond.slashBond(worker);

        // Verify employer received bond
        assertEq(usdc.balanceOf(employer), employerBalanceBefore + BOND_AMOUNT);

        // Verify worker state
        SuretyBond.Worker memory w = suretyBond.getWorker(worker);
        assertEq(w.bondAmount, 0);
        assertFalse(w.isEmployed);
    }

    function test_WithdrawRentSavings() public {
        _setupEmployedWorker();

        // Complete a wage claim cycle first
        for (uint i = 0; i < 5; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 80);
        }
        vm.warp(block.timestamp + 7 days);
        vm.prank(oracle);
        suretyBond.releaseWeeklyWage(worker);

        // Fast forward past rent lock period (90 days)
        vm.warp(block.timestamp + 90 days);

        uint256 rentSavings = suretyBond.getWorker(worker).rentSavings;
        uint256 workerBalanceBefore = usdc.balanceOf(worker);

        // Oracle releases rent savings
        vm.prank(oracle);
        suretyBond.releaseRentSavings(worker);

        assertEq(usdc.balanceOf(worker), workerBalanceBefore + rentSavings);
        assertEq(suretyBond.getWorker(worker).rentSavings, 0);
    }

    function testFail_ReleaseWithoutEnoughCheckIns() public {
        _setupEmployedWorker();

        // Only 3 check-ins (need 5)
        for (uint i = 0; i < 3; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 80);
        }

        vm.warp(block.timestamp + 7 days);

        vm.prank(oracle);
        suretyBond.releaseWeeklyWage(worker); // Should fail
    }

    function testFail_ReleaseWithLowTrustScore() public {
        _setupEmployedWorker();

        // 5 check-ins but low trust score
        for (uint i = 0; i < 5; i++) {
            vm.prank(oracle);
            suretyBond.submitCheckIn(worker, 30); // Below 50 threshold
        }

        vm.warp(block.timestamp + 7 days);

        vm.prank(oracle);
        suretyBond.releaseWeeklyWage(worker); // Should fail
    }

    // ============ Helper Functions ============

    function _setupVerifiedAndBondedWorker() internal {
        vm.prank(oracle);
        suretyBond.verifyWorker(worker);

        vm.startPrank(sponsor);
        usdc.approve(address(suretyBond), BOND_AMOUNT);
        suretyBond.stakeBond(worker, BOND_AMOUNT);
        vm.stopPrank();
    }

    function _setupEmployedWorker() internal {
        _setupVerifiedAndBondedWorker();

        vm.startPrank(employer);
        usdc.approve(address(suretyBond), WEEKLY_WAGE * 4);
        suretyBond.hireWorker(worker, WEEKLY_WAGE);
        vm.stopPrank();
    }
}
