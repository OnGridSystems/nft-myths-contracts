const { task } = require('hardhat/config');

task('4.2-add-batches-1-11', 'add batches 1-11').setAction(async(taskArgs, hre) => {
  const ethers = hre.ethers;

  const { execute } = hre.deployments;

  const listAccounts = await ethers.provider.listAccounts();
  const deployerAddress = listAccounts[0];

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    4,
    19,
    'ipfs://Qmd8Dvx2RTmjEHdBhFNB699CmbZaTPiCokXnmAsTh4ZUyh',
    100000,
  );
  console.log('batch 1 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    20,
    51,
    'ipfs://QmbiyroX5d4QNhG1zc5DHkSY7J3EJJePupZFs2jiiszdBh',
    50000,
  );
  console.log('batch 2 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    52,
    100,
    'ipfs://QmNcUUAcsixCfT8FcKGsGLLyoABfjcqoH5akhJM9FS7HsA',
    25000,
  );
  console.log('batch 3 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    101,
    329,
    'ipfs://QmPLuFo7y72yGvcdoPttHVEatfEch45jfUdKVmf9WDvnh1',
    12000,
  );
  console.log('batch 4 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    330,
    820,
    'ipfs://QmYZw9urh9DmZ28shkaxWxMDxpMAF8aRVEmv8n4ezU3Hrm',
    6000,
  );
  console.log('batch 5 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    821,
    1639,
    'ipfs://QmZ16RkDbP8r9EbiTmEXcMX3wFoGLT73G9xF5SnkFcYVW9',
    4000,
  );
  console.log('batch 6 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    1640,
    2786,
    'ipfs://Qmcr6B8bd73RFdJ7qGfed4vnMdYQaqRmXHnoSMQsE8Nr7o',
    1800,
  );
  console.log('batch 7 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    2787,
    4916,
    'ipfs://QmUKiqEqXjELnzCDE2V918nPWR29o6Sy4LvsqZXKXG6nMU',
    1600,
  );
  console.log('batch 8 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    4917,
    7866,
    'ipfs://QmPJEu9NHg1kNMirUp7ihksbCUBGRnvQuDYaaBjcnskJ3P',
    1400,
  );
  console.log('batch 9 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    7867,
    11471,
    'ipfs://QmVo5kVbJHXnjnstH5FS2fpAXxJTqFWsm1hTt4QGJrLeid',
    1200,
  );
  console.log('batch 10 is revealed');

  await execute(
    'Collection',
    { from: deployerAddress, log: true },
    'addBatch',
    11472,
    16383,
    'ipfs://QmWVNz31ama4C2smbp6LfBDFPKP3uwnM9wAiX2TYo5hWuH',
    1000,
  );
  console.log('batch 11 is revealed');
});
