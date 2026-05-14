// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MantlePulse {
    struct InsightRecord {
        uint256 timestamp;
        string summaryHash;
        string insightType;
        address triggeredBy;
    }

    mapping(uint256 => InsightRecord) public insights;
    uint256 public insightCount;
    address public owner;
    mapping(address => bool) public trackedWhales;

    event InsightLogged(uint256 indexed id, string insightType, address triggeredBy, uint256 timestamp);
    event WhaleAdded(address wallet);
    event WhaleRemoved(address wallet);

    modifier onlyOwner() {
        require(msg.sender == owner, "MantlePulse: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function logInsight(string calldata summaryHash, string calldata insightType) external {
        uint256 id = insightCount;
        insights[id] = InsightRecord({
            timestamp: block.timestamp,
            summaryHash: summaryHash,
            insightType: insightType,
            triggeredBy: msg.sender
        });
        insightCount = id + 1;
        emit InsightLogged(id, insightType, msg.sender, block.timestamp);
    }

    function addWhale(address wallet) external onlyOwner {
        trackedWhales[wallet] = true;
        emit WhaleAdded(wallet);
    }

    function removeWhale(address wallet) external onlyOwner {
        trackedWhales[wallet] = false;
        emit WhaleRemoved(wallet);
    }

    function getInsight(uint256 id) external view returns (InsightRecord memory) {
        require(id < insightCount, "MantlePulse: insight does not exist");
        return insights[id];
    }

    function getInsightCount() external view returns (uint256) {
        return insightCount;
    }
}
