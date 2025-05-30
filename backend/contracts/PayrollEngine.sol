// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.28;

import {IPayrollEngine} from "./IPayrollEngine.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
contract PayrollEngine is IPayrollEngine, Ownable {

  event VestingFactorySet(address vestingFactory);

  address public vestingFactory;
  mapping(address => bool) public allowed;
  mapping(address => address) public vestingCreated;

  modifier onlyAllowed() {
    require(allowed[msg.sender]);
    _;
  }

  constructor(address vestingFactory_) Ownable(msg.sender) {
    vestingFactory = vestingFactory_;
  }

  function depositPayroll() public onlyAllowed {
    address vesting = IVestingFactory(vestingFactory).deployVesting();
  }

  function setVestingFactory(address vestingFactory_) public onlyOwner {
    vestingFactory = vestingFactory_;
    emit VestingFactorySet(vestingFactory_);
  }

}
