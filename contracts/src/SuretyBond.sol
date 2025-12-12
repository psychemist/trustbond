// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SuretyBond
 * @author SuretyDAO Team
 * @notice Employment insurance protocol for at-risk workers
 * @dev Manages bonds, hiring, wage claims with 85/5/5/5 split
 */
contract SuretyBond is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant WORKER_SHARE = 8500; // 85% -> Worker Wallet
    uint256 public constant INSURANCE_SHARE = 500; // 5%  -> Insurance Pool
    uint256 public constant PROTOCOL_SHARE = 500; // 5%  -> Protocol Treasury
    uint256 public constant RENT_SAVINGS_SHARE = 500; // 5%  -> Rent Savings Fund
    uint256 public constant BASIS_POINTS = 10000;

    uint256 public constant CLAIM_INTERVAL = 7 days;
    uint256 public constant MIN_CHECKINS = 5;
    uint256 public constant MIN_TRUST_SCORE = 50;
    uint256 public constant RENT_LOCK_PERIOD = 90 days;

    // ============ Structs ============
    struct Worker {
        bool isVerified;
        uint256 trustScore; // 0-100 from AI oracle
        uint256 bondAmount; // Insurance collateral
        uint256 weeklyWage; // Total weekly salary
        uint256 depositedSalary; // Total salary deposited by employer
        uint256 rentSavings; // Accumulated rent fund (locked)
        uint256 rentSavingsUnlockTime;
        address employer;
        uint256 lastClaimTimestamp;
        uint256 weeklyCheckIns; // Counter: must have 5+ to claim
        bool isEmployed;
    }

    // ============ State Variables ============
    IERC20 public paymentToken; // USDC or stablecoin
    address public treasuryWallet; // Protocol fee recipient
    address public insurancePool; // Insurance pool address
    address public oracle; // AI oracle address (can submit check-ins)

    mapping(address => Worker) public workers;

    // ============ Events ============
    event WorkerVerified(address indexed worker);
    event BondStaked(
        address indexed worker,
        address indexed sponsor,
        uint256 amount
    );
    event WorkerHired(
        address indexed worker,
        address indexed employer,
        uint256 weeklyWage,
        uint256 totalDeposit
    );
    event CheckInSubmitted(
        address indexed worker,
        uint256 trustScore,
        uint256 weeklyCheckIns
    );
    event WageReleased(
        address indexed worker,
        uint256 workerAmount,
        uint256 insuranceAmount,
        uint256 protocolAmount,
        uint256 rentSavingsAmount,
        bool isEmergency
    );
    event BondSlashed(
        address indexed worker,
        address indexed employer,
        uint256 amount
    );
    event RentSavingsReleased(
        address indexed worker,
        uint256 amount,
        bool isEmergency
    );
    event EmploymentEnded(address indexed worker, address indexed employer);

    // ============ Modifiers ============
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call");
        _;
    }

    modifier onlyEmployer(address _worker) {
        require(workers[_worker].employer == msg.sender, "Not the employer");
        _;
    }

    // ============ Constructor ============
    constructor(
        address _paymentToken,
        address _treasuryWallet,
        address _insurancePool,
        address _oracle
    ) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        treasuryWallet = _treasuryWallet;
        insurancePool = _insurancePool;
        oracle = _oracle;
    }

    // ============ Oracle/Admin Functions ============

    /**
     * @notice Verify a worker (called by rehab center/NGO oracle)
     * @param _worker Address of the worker to verify
     */
    function verifyWorker(address _worker) external onlyOracle {
        require(!workers[_worker].isVerified, "Already verified");
        workers[_worker].isVerified = true;
        workers[_worker].trustScore = 100; // Start with full trust
        emit WorkerVerified(_worker);
    }

    /**
     * @notice Submit daily check-in with AI trust score
     * @param _worker Address of the worker
     * @param _trustScore Trust score from AI analysis (0-100)
     */
    function submitCheckIn(
        address _worker,
        uint256 _trustScore
    ) external onlyOracle {
        require(workers[_worker].isEmployed, "Worker not employed");
        require(_trustScore <= 100, "Invalid trust score");

        Worker storage worker = workers[_worker];
        worker.trustScore = _trustScore;
        worker.weeklyCheckIns += 1;

        emit CheckInSubmitted(_worker, _trustScore, worker.weeklyCheckIns);
    }

    // ============ Sponsor Functions ============

    /**
     * @notice Stake insurance bond for a worker (by NGO/Sponsor)
     * @param _worker Address of the worker to insure
     * @param _amount Amount of bond to stake
     */
    function stakeBond(address _worker, uint256 _amount) external nonReentrant {
        require(workers[_worker].isVerified, "Worker not verified");
        require(_amount > 0, "Amount must be > 0");

        paymentToken.safeTransferFrom(msg.sender, address(this), _amount);
        workers[_worker].bondAmount += _amount;

        emit BondStaked(_worker, msg.sender, _amount);
    }

    // ============ Employer Functions ============

    /**
     * @notice Hire a worker and deposit salary for 4 weeks
     * @param _worker Address of the worker to hire
     * @param _weeklyWage Weekly wage amount
     */
    function hireWorker(
        address _worker,
        uint256 _weeklyWage
    ) external nonReentrant {
        Worker storage worker = workers[_worker];
        require(worker.isVerified, "Worker not verified");
        require(worker.bondAmount > 0, "Worker not insured");
        require(!worker.isEmployed, "Worker already employed");
        require(_weeklyWage > 0, "Wage must be > 0");

        uint256 totalDeposit = _weeklyWage * 4; // 4 weeks upfront
        paymentToken.safeTransferFrom(msg.sender, address(this), totalDeposit);

        worker.employer = msg.sender;
        worker.weeklyWage = _weeklyWage;
        worker.depositedSalary = totalDeposit;
        worker.isEmployed = true;
        worker.lastClaimTimestamp = block.timestamp;
        worker.weeklyCheckIns = 0;

        // Set rent savings unlock time (3 months from hire)
        if (worker.rentSavingsUnlockTime == 0) {
            worker.rentSavingsUnlockTime = block.timestamp + RENT_LOCK_PERIOD;
        }

        emit WorkerHired(_worker, msg.sender, _weeklyWage, totalDeposit);
    }

    /**
     * @notice Slash the worker's bond due to theft/misconduct
     * @param _worker Address of the worker
     */
    function slashBond(
        address _worker
    ) external onlyEmployer(_worker) nonReentrant {
        Worker storage worker = workers[_worker];
        require(worker.bondAmount > 0, "No bond to slash");

        uint256 slashAmount = worker.bondAmount;
        worker.bondAmount = 0;
        worker.isEmployed = false;
        worker.employer = address(0);

        paymentToken.safeTransfer(msg.sender, slashAmount);

        emit BondSlashed(_worker, msg.sender, slashAmount);
    }

    /**
     * @notice End employment and refund remaining salary
     * @param _worker Address of the worker
     */
    function endEmployment(
        address _worker
    ) external onlyEmployer(_worker) nonReentrant {
        Worker storage worker = workers[_worker];

        uint256 refund = worker.depositedSalary;
        worker.depositedSalary = 0;
        worker.isEmployed = false;
        worker.employer = address(0);
        worker.weeklyWage = 0;
        worker.weeklyCheckIns = 0;

        if (refund > 0) {
            paymentToken.safeTransfer(msg.sender, refund);
        }

        emit EmploymentEnded(_worker, msg.sender);
    }

    // ============ Worker/Oracle Wage Functions ============

    /**
     * @notice Oracle pushes weekly wage to worker (Gasless for worker)
     * @param _worker Address of the worker to pay
     */
    function releaseWeeklyWage(
        address _worker
    ) external onlyOracle nonReentrant {
        _processWagePayment(_worker, false);
    }

    /**
     * @dev Internal function to handle wage logic (DRY)
     */
    function _processWagePayment(
        address _workerAddr,
        bool _isEmergency
    ) internal {
        Worker storage worker = workers[_workerAddr];

        require(worker.isEmployed, "Not employed");
        require(
            block.timestamp >= worker.lastClaimTimestamp + CLAIM_INTERVAL,
            "Too early"
        );

        // In emergency mode, we might relax check-in requirements or require them strictly
        // For MVP, strictly require check-ins even in emergency (data must be on-chain)
        require(worker.weeklyCheckIns >= MIN_CHECKINS, "Not enough check-ins");
        require(worker.trustScore >= MIN_TRUST_SCORE, "Trust score too low");
        require(
            worker.depositedSalary >= worker.weeklyWage,
            "Insufficient deposited salary"
        );

        uint256 wage = worker.weeklyWage;
        worker.depositedSalary -= wage;

        // Calculate splits
        uint256 workerAmount = (wage * WORKER_SHARE) / BASIS_POINTS;
        uint256 insuranceAmount = (wage * INSURANCE_SHARE) / BASIS_POINTS;
        uint256 protocolAmount = (wage * PROTOCOL_SHARE) / BASIS_POINTS;
        uint256 rentSavingsAmount = (wage * RENT_SAVINGS_SHARE) / BASIS_POINTS;

        // Reset weekly counters
        worker.lastClaimTimestamp = block.timestamp;
        worker.weeklyCheckIns = 0;

        // Add to rent savings (locked)
        worker.rentSavings += rentSavingsAmount;

        // Transfer splits
        paymentToken.safeTransfer(_workerAddr, workerAmount);
        paymentToken.safeTransfer(insurancePool, insuranceAmount);
        paymentToken.safeTransfer(treasuryWallet, protocolAmount);

        emit WageReleased(
            _workerAddr,
            workerAmount,
            insuranceAmount,
            protocolAmount,
            rentSavingsAmount,
            _isEmergency
        );
    }

    /**
     * @notice Oracle releases rent savings to worker (Gasless)
     */
    function releaseRentSavings(
        address _worker
    ) external onlyOracle nonReentrant {
        _processRentWithdrawal(_worker, false);
    }

    function _processRentWithdrawal(
        address _workerAddr,
        bool _isEmergency
    ) internal {
        Worker storage worker = workers[_workerAddr];

        require(worker.rentSavings > 0, "No rent savings");
        require(
            block.timestamp >= worker.rentSavingsUnlockTime,
            "Rent savings locked"
        );

        uint256 amount = worker.rentSavings;
        worker.rentSavings = 0;

        paymentToken.safeTransfer(_workerAddr, amount);

        emit RentSavingsReleased(_workerAddr, amount, _isEmergency);
    }

    // ============ Admin Override Functions ============

    /**
     * @notice Admin force releases wage if Oracle is unresponsive
     * @dev Only owner can call. Use when Oracle is down/malicious.
     * @param _worker Address of the worker to pay
     */
    function adminForceReleaseWage(
        address _worker
    ) external onlyOwner nonReentrant {
        _processWagePayment(_worker, true); // true = emergency/admin override
    }

    /**
     * @notice Admin force releases rent savings if Oracle is unresponsive
     * @param _worker Address of the worker
     */
    function adminForceReleaseRent(
        address _worker
    ) external onlyOwner nonReentrant {
        _processRentWithdrawal(_worker, true);
    }

    // ============ View Functions ============

    function getWorker(address _worker) external view returns (Worker memory) {
        return workers[_worker];
    }

    function canClaimWage(
        address _worker
    ) external view returns (bool canClaim, string memory reason) {
        Worker memory worker = workers[_worker];

        if (!worker.isEmployed) return (false, "Not employed");
        if (block.timestamp < worker.lastClaimTimestamp + CLAIM_INTERVAL)
            return (false, "Too early");
        if (worker.weeklyCheckIns < MIN_CHECKINS)
            return (false, "Need more check-ins");
        if (worker.trustScore < MIN_TRUST_SCORE)
            return (false, "Trust score too low");
        if (worker.depositedSalary < worker.weeklyWage)
            return (false, "No salary left");

        return (true, "Ready to claim");
    }

    function getWageBreakdown(
        address _worker
    )
        external
        view
        returns (
            uint256 workerAmount,
            uint256 insuranceAmount,
            uint256 protocolAmount,
            uint256 rentSavingsAmount
        )
    {
        uint256 wage = workers[_worker].weeklyWage;
        workerAmount = (wage * WORKER_SHARE) / BASIS_POINTS;
        insuranceAmount = (wage * INSURANCE_SHARE) / BASIS_POINTS;
        protocolAmount = (wage * PROTOCOL_SHARE) / BASIS_POINTS;
        rentSavingsAmount = (wage * RENT_SAVINGS_SHARE) / BASIS_POINTS;
    }

    // ============ Admin Functions ============

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasuryWallet = _treasury;
    }

    function setInsurancePool(address _pool) external onlyOwner {
        insurancePool = _pool;
    }
}
