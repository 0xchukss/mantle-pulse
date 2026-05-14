import hre from "hardhat";

async function main() {
  const MantlePulse = await hre.ethers.getContractFactory("MantlePulse");
  const mantlePulse = await MantlePulse.deploy();
  await mantlePulse.waitForDeployment();

  const address = await mantlePulse.getAddress();
  console.log(`Deployed to: ${address}`);

  const deploymentTx = mantlePulse.deploymentTransaction();
  if (deploymentTx) {
    console.log("Waiting for 5 confirmations...");
    await deploymentTx.wait(5);
  }

  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: []
    });
    const explorer =
      hre.network.name === "mantle_testnet"
        ? `https://explorer.sepolia.mantle.xyz/address/${address}`
        : `https://explorer.mantle.xyz/address/${address}`;
    console.log(`Verified: ${explorer}`);
  } catch (error) {
    console.warn("Verification skipped or failed:", error instanceof Error ? error.message : error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
