require("@nomiclabs/hardhat-waffle");
const fs = require('fs')
const privateKey = fs.readFileSync(".secret").toString().trim();

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId : 1337
    },
    mumbai: {
      url:"https://polygon-mumbai.g.alchemy.com/v2/J3z905cLYe2nxXV4IRO8kViLKrnfb3LY",
      accounts: [privateKey]
    },
    mainnet: {
      url:"https://polygon-mainnet.g.alchemy.com/v2/M912P5yX1VnP6Z4QgiKeXnDTvdWq4YqG",
      accounts: [privateKey] }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  
}
