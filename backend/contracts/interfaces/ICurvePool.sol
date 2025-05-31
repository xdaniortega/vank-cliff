// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICurvePool {
    function exchange(
        int128 i,
        int128 j,
        uint256 dx,
        uint256 minDy,
        address receiver
    ) external returns (uint256);

    function addLiquidity(
        uint256[] calldata amounts,
        uint256 minMintAmount,
        address receiver
    ) external returns (uint256);

    function getDy(
        int128 i,
        int128 j,
        uint256 dx
    ) external view returns (uint256);

    function calcTokenAmount(
        uint256[] calldata amounts,
        bool isDeposit
    ) external view returns (uint256);

    function coins(uint256 i) external view returns (address);
}