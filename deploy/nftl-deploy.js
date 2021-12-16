module.exports = async function({ ethers, getNamedAccounts, deployments, hre }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('NFTL', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

module.exports.tags = ['NFTL'];
