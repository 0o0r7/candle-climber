// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title CCDeathCard — Candle Climber "Death Card" NFT (Robinhood Chain TESTNET demo)
/// @notice Minimal, non-upgradeable ERC-721 + ERC-721-Metadata. Mint is owner-only
///         (the key-protected server minter from docs/DEATHCARD-NFT-TESTNET-NOTE.md
///         architecture B) and idempotent per run key: one card per run, forever.
///         Metadata is a string the minter passes — an inline data-URI JSON of the
///         run's own honest facts (ticker, terrain source, peak height, UTC date,
///         interval, rank). Nothing is invented on-chain; no scarcity or utility
///         claims exist in the contract. Testnet-only by design: zero monetary
///         value, the point is to prove the loop end-to-end.
contract CCDeathCard {
    string public name = "Candle Climber Death Card";
    string public symbol = "CCDC";

    /// Deployer = the server minter EOA. Not upgradeable, not renounced-and-lost:
    /// the only power is mint() on the testnet demo contract.
    address public immutable owner;

    uint256 public nextId = 1;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    /// runKey = keccak256 of the run's canonical facts (+ claiming wallet).
    /// One mint per run key, enforced HERE (on-chain), not just server-side.
    mapping(bytes32 => uint256) public mintedByRun;

    /// Full metadata string per token (inline data:application/json;base64,... URI).
    mapping(uint256 => string) public tokenURIData;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed tokenOwner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed tokenOwner, address indexed operator, bool approved);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    /// Mint one card for `to`, bound to `runKey`. Reverts on re-mint of the same run.
    function mint(address to, bytes32 runKey, string calldata metadata)
        external
        onlyOwner
        returns (uint256 id)
    {
        require(mintedByRun[runKey] == 0, "RUN_MINTED");
        id = nextId++;
        mintedByRun[runKey] = id;
        _ownerOf[id] = to;
        balanceOf[to] += 1;
        tokenURIData[id] = metadata;
        emit Transfer(address(0), to, id);
    }

    /// ERC-721-Metadata: returns the stored inline JSON URI verbatim.
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf[tokenId] != address(0), "NO_TOKEN");
        return tokenURIData[tokenId];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _ownerOf[tokenId];
        require(o != address(0), "NO_TOKEN");
        return o;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        address o = _ownerOf[tokenId];
        require(o != address(0), "NO_TOKEN");
        require(from == o, "WRONG_FROM");
        require(to != address(0), "ZERO_TO");
        require(
            msg.sender == o || msg.sender == getApproved[tokenId] || isApprovedForAll[o][msg.sender],
            "NOT_ALLOWED"
        );
        delete getApproved[tokenId];
        _ownerOf[tokenId] = to;
        balanceOf[from] -= 1;
        balanceOf[to] += 1;
        emit Transfer(from, to, tokenId);
    }

    function approve(address spender, uint256 tokenId) external {
        address o = _ownerOf[tokenId];
        require(o != address(0), "NO_TOKEN");
        require(msg.sender == o || isApprovedForAll[o][msg.sender], "NOT_ALLOWED");
        getApproved[tokenId] = spender;
        emit Approval(o, spender, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /// ERC-165: ERC-165 itself, ERC-721, ERC-721-Metadata.
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 // ERC-165
            || interfaceId == 0x80ac58cd // ERC-721
            || interfaceId == 0x5b5e139f; // ERC-721 Metadata
    }
}
