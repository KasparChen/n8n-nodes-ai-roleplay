import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class RoleplayAIApi implements ICredentialType {
	name = 'roleplayAIApi';
	displayName = 'Roleplay AI API';
	documentationUrl = 'https://github.com/kasparchen/n8n-nodes-ai-roleplay';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API Key',
		},
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://openrouter.ai/api/v1',
			required: true,
			description: 'The base URL of the AI API service (e.g. https://openrouter.ai/api/v1, https://api.anthropic.com/v1, etc.)',
		},
		{
			displayName: 'Provider Type',
			name: 'providerType',
			type: 'options',
			options: [
				{
					name: 'OpenRouter/OpenAI',
					value: 'openai',
					description: 'OpenRouter or OpenAI-compatible API',
				},
				{
					name: 'Anthropic',
					value: 'anthropic',
					description: 'Anthropic Claude API',
				},
				{
					name: 'Ollama',
					value: 'ollama',
					description: 'Ollama API',
				},
			],
			default: 'openai',
			description: 'The type of API provider. Note: This only affects which models are available in the model list and how the API request is formatted. It does not change any functionality.',
		},
	];
}
