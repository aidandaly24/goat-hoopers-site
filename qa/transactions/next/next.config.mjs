import {fileURLToPath} from 'node:url';
const config = {
  devIndicators:false,
  distDir:process.env.TRANSACTIONS_QA_DIST ?? '.next',
  outputFileTracingRoot:fileURLToPath(new URL('../../../',import.meta.url)),
  webpack(config){config.resolve.alias['@']=fileURLToPath(new URL('../../../src',import.meta.url));return config;},
};
export default config;
