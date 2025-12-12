// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SuretyBond.sol";

contract DeploySuretyBond is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // For MVP/testnet, we'll use the deployer as all addresses
        // In production, these should be separate addresses
        address deployer = vm.addr(deployerPrivateKey);
        
        // You can set these to actual addresses or use deployer for testing
        address paymentToken = vm.envOr("PAYMENT_TOKEN", address(0)); // Will need to deploy mock or use existing
        address treasuryWallet = vm.envOr("TREASURY_WALLET", deployer);
        address insurancePool = vm.envOr("INSURANCE_POOL", deployer);
        address oracle = vm.envOr("ORACLE_ADDRESS", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // If no payment token set, deploy a mock USDC for testing
        if (paymentToken == address(0)) {
            MockUSDC mockUsdc = new MockUSDC();
            paymentToken = address(mockUsdc);
            console.log("Deployed MockUSDC at:", paymentToken);
            
            // Mint some tokens for testing
            mockUsdc.mint(deployer, 1_000_000 * 1e6); // 1M USDC
            console.log("Minted 1M MockUSDC to deployer");
        }

        SuretyBond suretyBond = new SuretyBond(
            paymentToken,
            treasuryWallet,
            insurancePool,
            oracle
        );

        console.log("============================================");
        console.log("SuretyBond deployed at:", address(suretyBond));
        console.log("Payment Token:", paymentToken);
        console.log("Treasury:", treasuryWallet);
        console.log("Insurance Pool:", insurancePool);
        console.log("Oracle:", oracle);
        console.log("============================================");

        vm.stopBroadcast();
    }
}

/**
 * @title MockUSDC
 * @notice Simple mock USDC for testing (6 decimals like real USDC)
 */
contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
