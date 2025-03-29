
import { ethers } from "ethers";

// ABI is a subset of the contract interface
const abi = [
  "function owner() external view returns (address)",
  "function auditors(address) external view returns (bool)",
  "function addAuditor(address _auditor) external",
  "function removeAuditor(address _auditor) external",
  "function submitPaper(string memory _title, string memory _author, string memory _ipfsHash, bytes32 _fileHash, bytes memory _signature, uint256[] memory _references) external",
  "function approvePaper(uint256 _paperId) external",
  "function rejectPaper(uint256 _paperId) external",
  "function removePaper(uint256 _paperId) external",
  "function addVersion(uint256 _paperId, string memory _ipfsHash, bytes32 _fileHash, bytes memory _signature, uint256[] memory _references) external",
  "function getPaperInfo(uint256 _paperId) external view returns (address paperOwner, string memory title, string memory author, uint8 status, uint256 versionCount)",
  "function getVersion(uint256 _paperId, uint256 _verIndex) external view returns (string memory ipfsHash, bytes32 fileHash, uint256 timestamp, bytes memory signature, uint256[] memory references)",
  "function paperCount() external view returns (uint256)"
];

// Contract address - replace with actual deployed contract
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export async function getContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
}

export async function getContractReadOnly() {
  if (!window.ethereum) {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    return new ethers.Contract(contractAddress, abi, provider);
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(contractAddress, abi, provider);
}

export enum PaperStatus {
  PENDING = 0,
  PUBLISHED = 1,
  REJECTED = 2,
  REMOVED = 3
}

export function mapStatusToString(status: number): string {
  switch (status) {
    case PaperStatus.PENDING: return "待审核";
    case PaperStatus.PUBLISHED: return "已发布";
    case PaperStatus.REJECTED: return "已驳回";
    case PaperStatus.REMOVED: return "已删除";
    default: return "未知状态";
  }
}
