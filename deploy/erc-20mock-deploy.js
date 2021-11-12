module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const name = 'NFTL';
  const symbol = 'NFTL';
  const toAddress = deployer;
  const startBalance = 0;

  await deploy('ERC20Mock', {
    from: deployer,
    log: true,
    args: [name, symbol, toAddress, startBalance],
    skipIfAlreadyDeployed: true,
  });
};

module.exports.tags = ['ERC20Mock'];
