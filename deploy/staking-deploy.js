module.exports = async function({ ethers, getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const nftlToken = (await ethers.getContract('ERC20Mock')).address;
  const heroesToken = (await ethers.getContract('Collection')).address;

  await deploy('NFTStaking', {
    from: deployer,
    log: true,
    args: [nftlToken, heroesToken],
    skipIfAlreadyDeployed: true,
  });
};

module.exports.dependencies = ['Collection', 'ERC20Mock'];
