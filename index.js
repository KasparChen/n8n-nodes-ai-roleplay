const { RoleplayAi } = require('./dist/nodes/RoleplayAI/RoleplayAi.node');
const { RoleplayAIApi } = require('./dist/credentials/RoleplayAIApi.credentials');

module.exports = {
    nodes: [
        RoleplayAi
    ],
    credentials: [
        RoleplayAIApi
    ],
    version: require('./package.json').version,
};
