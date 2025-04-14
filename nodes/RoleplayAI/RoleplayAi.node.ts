import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionType } from 'n8n-workflow';

interface IRoleplayAIModel {
	id: string;
	name?: string;
	description?: string;
	context_length?: number;
	pricing?: {
		prompt?: string;
		completion?: string;
	};
}

interface IRoleplayAIResponse extends IDataObject {
	id: string;
	model: string;
	created: number;
	object: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	choices: Array<{
		message: {
			role: string;
			content: string;
			name?: string;
		};
		finish_reason: string;
		index: number;
	}>;
}

export class RoleplayAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Roleplay AI',
		name: 'roleplayAi',
		icon: 'file:roleplay.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with AI models for roleplaying scenarios',
		defaults: {
			name: 'Roleplay AI',
		},
		inputs: ['main'] as never[],
		outputs: ['main'] as never[],
		credentials: [
			{
				name: 'roleplayAIApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
						description: 'Send a roleplay chat message',
						action: 'Send a roleplay chat message',
					},
					{
						name: 'Custom API Call',
						value: 'custom',
						description: 'Make a custom API call through HTTP request',
						action: 'Make a custom API call through HTTP request',
					},
				],
				default: 'chat',
			},
			{
				displayName: 'Use Custom Model',
				name: 'useCustomModel',
				type: 'boolean',
				default: false,
				description: 'Whether to use a custom model identifier instead of selecting from the list',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
						useCustomModel: [
							false,
						],
					},
				},
			},
			{
				displayName: 'Custom Model Identifier',
				name: 'customModel',
				type: 'string',
				default: '',
				placeholder: 'gpt-4-turbo, claude-3-opus, gemini-1.5-pro, etc.',
				description: 'Enter a custom model identifier',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
						useCustomModel: [
							true,
						],
					},
				},
			},
			{
				displayName: 'Character Name',
				name: 'characterName',
				type: 'string',
				default: '',
				description: 'Name of the character in the roleplay',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include User Name',
				name: 'includeUserName',
				type: 'boolean',
				default: false,
				description: 'Whether to include a custom user name',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'User Name',
				name: 'userName',
				type: 'string',
				default: '',
				description: 'Name of the user in the roleplay (defaults to "you" if not specified)',
				displayOptions: {
					show: {
						includeUserName: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Character Description',
				name: 'characterDescription',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Description of the character, including role and personality',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'First Message',
				name: 'firstMessage',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The first message from the character to start the conversation',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Scenario',
				name: 'includeScenario',
				type: 'boolean',
				default: false,
				description: 'Whether to include scenario details',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Scenario',
				name: 'scenario',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Description of the roleplay scenario',
				displayOptions: {
					show: {
						includeScenario: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Message Example',
				name: 'includeMessageExample',
				type: 'boolean',
				default: false,
				description: 'Whether to include message examples',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Message Example',
				name: 'messageExample',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Example of conversation format',
				displayOptions: {
					show: {
						includeMessageExample: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Model Preset',
				name: 'includeModelPreset',
				type: 'boolean',
				default: false,
				description: 'Whether to include model preset instructions',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Model Preset',
				name: 'modelPreset',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Instructions for the model behavior',
				displayOptions: {
					show: {
						includeModelPreset: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Format Guidelines',
				name: 'includeFormatGuidelines',
				type: 'boolean',
				default: false,
				description: 'Whether to include format guidelines',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Format Guidelines',
				name: 'formatGuidelines',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Guidelines for formatting responses',
				displayOptions: {
					show: {
						includeFormatGuidelines: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Chat Summary',
				name: 'includeChatSummary',
				type: 'boolean',
				default: false,
				description: 'Whether to include a chat summary after the first message in format {"system":"{chat_summary}"}',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Chat Summary',
				name: 'chatSummary',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Summary of the chat history that will be inserted after the first message. Can include conditional logic.',
				displayOptions: {
					show: {
						includeChatSummary: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Chat History',
				name: 'includeChatHistory',
				type: 'boolean',
				default: false,
				description: 'Whether to include chat history after the chat summary',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Chat History',
				name: 'chatHistory',
				type: 'json',
				default: '[{"role": "user", "content": "Message content"}, {"role": "assistant", "content": "Reply content", "name": "Character name"}]',
				typeOptions: {
					rows: 5,
				},
				description: 'JSON formatted chat history with role (user/assistant), content (message text) and name (optional) fields',
				displayOptions: {
					show: {
						includeChatHistory: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Other Pre-Message',
				name: 'includeOtherPreMsg',
				type: 'boolean',
				default: false,
				description: 'Whether to include other pre-message instructions',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Other Pre-Message',
				name: 'otherPreMsg',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Additional pre-message instructions',
				displayOptions: {
					show: {
						includeOtherPreMsg: [true],
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'User Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The message to send to the chat model',
				required: true,
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Include Raw Output',
				name: 'includeRawOutput',
				type: 'boolean',
				default: false,
				description: 'Whether to include raw message data in the output',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.9,
				description: 'What sampling temperature to use',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
				options: [
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						description: 'The maximum number of tokens to generate',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						default: 0,
						description:
							'Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far.',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						default: 1,
						description:
							'An alternative to sampling with temperature, called nucleus sampling',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('roleplayAIApi');
				const baseUrl = credentials.baseUrl as string;
				const providerType = credentials.providerType as string || 'openai';

				const headers: IDataObject = {
					Authorization: `Bearer ${credentials.apiKey}`,
					'Content-Type': 'application/json',
				};

				// 添加Anthropic特定的header
				if (providerType === 'anthropic') {
					headers['anthropic-version'] = '2023-06-01';
					headers['x-api-key'] = credentials.apiKey;
				}

				const options: IHttpRequestOptions = {
					url: `${baseUrl}/models`,
					headers,
					method: 'GET' as IHttpRequestMethods,
					json: true,
				};

				try {
					const response = await this.helpers.request(options);

					// 确保response存在，但不需要特定格式
					if (!response) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid response from API',
						);
					}

					// 尝试从不同格式的响应中提取model数据
					let modelData: IRoleplayAIModel[] = [];

					if (response.data && Array.isArray(response.data)) {
						// OpenRouter/OpenAI格式
						modelData = response.data;
					} else if (Array.isArray(response)) {
						// 某些API直接返回数组
						modelData = response;
					} else if (response.models && Array.isArray(response.models)) {
						// Anthropic格式
						modelData = response.models;
					} else {
						// 如果无法识别格式，尝试自动检测数组字段
						for (const key in response) {
							if (Array.isArray(response[key])) {
								const firstItem = response[key][0];
								// 检查数组元素是否有id字段，这通常表示它是模型列表
								if (firstItem && typeof firstItem === 'object' && 'id' in firstItem) {
									modelData = response[key];
									break;
								}
							}
						}
					}

					if (modelData.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not find any models in the API response',
						);
					}

					const models = modelData
						.filter((model: IRoleplayAIModel) => model.id)
						.map((model: IRoleplayAIModel) => ({
							name: model.name || model.id,
							value: model.id,
							description: model.description || '',
						}))
						.sort((a: INodePropertyOptions, b: INodePropertyOptions) =>
							a.name.localeCompare(b.name),
						);

					if (models.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No valid models found in API response',
						);
					}

					return models;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to load models: ${(error as Error).message}`,
					);
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('roleplayAIApi');
		if (!credentials?.apiKey) {
			throw new NodeOperationError(this.getNode(), 'No valid API key provided');
		}

		const baseUrl = credentials.baseUrl as string;
		const providerType = credentials.providerType as string || 'openai';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'chat') {
					const useCustomModel = this.getNodeParameter('useCustomModel', i) as boolean;

					// 获取model ID
					let modelId = '';
					if (useCustomModel) {
						modelId = this.getNodeParameter('customModel', i) as string;
					} else {
						modelId = this.getNodeParameter('model', i) as string;
					}

					const characterName = this.getNodeParameter('characterName', i) as string;
					const includeUserName = this.getNodeParameter('includeUserName', i) as boolean;
					const userName = includeUserName ? this.getNodeParameter('userName', i, '') as string : 'you';
					const characterDescription = this.getNodeParameter('characterDescription', i) as string;
					const firstMessage = this.getNodeParameter('firstMessage', i) as string;

					const includeScenario = this.getNodeParameter('includeScenario', i) as boolean;
					const scenario = includeScenario ? this.getNodeParameter('scenario', i, '') as string : '';

					const includeMessageExample = this.getNodeParameter('includeMessageExample', i) as boolean;
					const messageExample = includeMessageExample ? this.getNodeParameter('messageExample', i, '') as string : '';

					const includeModelPreset = this.getNodeParameter('includeModelPreset', i) as boolean;
					const modelPreset = includeModelPreset ? this.getNodeParameter('modelPreset', i, '') as string : '';

					const includeFormatGuidelines = this.getNodeParameter('includeFormatGuidelines', i) as boolean;
					const formatGuidelines = includeFormatGuidelines ? this.getNodeParameter('formatGuidelines', i, '') as string : '';

					const includeChatSummary = this.getNodeParameter('includeChatSummary', i) as boolean;
					const chatSummary = includeChatSummary ? this.getNodeParameter('chatSummary', i, '') as string : '';

					const includeChatHistory = this.getNodeParameter('includeChatHistory', i) as boolean;
					const chatHistory = includeChatHistory ? JSON.parse(this.getNodeParameter('chatHistory', i, '[]') as string) : [];

					const includeOtherPreMsg = this.getNodeParameter('includeOtherPreMsg', i) as boolean;
					const otherPreMsg = includeOtherPreMsg ? this.getNodeParameter('otherPreMsg', i, '') as string : '';

					const message = this.getNodeParameter('message', i) as string;
					const includeRawOutput = this.getNodeParameter('includeRawOutput', i) as boolean;
					const temperature = this.getNodeParameter('temperature', i) as number;
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

					// Construct messages array for the API request
					const messages = [];

					// Add model preset
					if (modelPreset) {
						messages.push({
							role: 'system',
							content: `${modelPreset}\nYou need to use ${characterName} as your name, and ${userName} refer to user`,
						});
					}

					// Add character description
					messages.push({
						role: 'system',
						content: `Character:${characterDescription}`,
					});

					// Add scenario if enabled
					if (scenario) {
						messages.push({
							role: 'system',
							content: `Scenario:${scenario}`,
						});
					}

					// Add message example if enabled
					if (messageExample) {
						messages.push({
							role: 'system',
							content: `Here are examples of our conversation: ${messageExample}`,
						});
					}

					// Add format guidelines if enabled
					if (formatGuidelines) {
						messages.push({
							role: 'system',
							content: `The conversation must follow the formats: ${formatGuidelines}`,
						});
					}

					// Add other pre-message if enabled
					if (otherPreMsg) {
						messages.push({
							role: 'system',
							content: otherPreMsg,
						});
					}

					// Add start chat marker
					messages.push({
						role: 'system',
						content: '[Start a new Chat]',
					});

					// Add first message from assistant
					messages.push({
						role: 'assistant',
						content: firstMessage,
						name: characterName,
					});

					// Add chat summary if enabled - 在firstMessage之后以特定JSON格式插入
					if (chatSummary) {
						messages.push({
							role: 'system',
							content: `${chatSummary}`,
						});
					}

					// Add chat history if enabled - 确保正确格式插入
					if (includeChatHistory) {
						try {
							if (chatHistory && Array.isArray(chatHistory)) {
								// 逐个检查并添加chat history的每个消息
								for (const entry of chatHistory) {
									if (entry && typeof entry === 'object' && 'role' in entry && 'content' in entry) {
										messages.push(entry);
									}
								}
							}
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid chat history format: ${(error as Error).message}`,
							);
						}
					}

					// Add user message
					messages.push({
						role: 'user',
						content: message,
					});

					const requestBody = {
						model: modelId,
						messages,
						temperature,
						...additionalFields,
					};

					// 创建请求头
					const headers: IDataObject = {
						Authorization: `Bearer ${credentials.apiKey}`,
						'HTTP-Referer': 'https://github.com/kasparchen/n8n-nodes-ai-roleplay',
						'X-Title': 'n8n Roleplay AI Node',
						'Content-Type': 'application/json',
					};

					// 为Anthropic添加特定的header
					if (providerType === 'anthropic') {
						headers['anthropic-version'] = '2023-06-01';
						headers['x-api-key'] = credentials.apiKey;
						delete headers.Authorization;
					}

					const options: IHttpRequestOptions = {
						url: `${baseUrl}/chat/completions`,
						headers,
						method: 'POST' as IHttpRequestMethods,
						body: requestBody,
						json: true,
					};

					const response = await this.helpers.request(options);

					if (!response?.choices?.[0]?.message?.content) {
						throw new NodeOperationError(
							this.getNode(),
							'Invalid response format from AI API',
						);
					}

					const typedResponse = response as IRoleplayAIResponse;
					const messageContent = typedResponse.choices[0].message.content.trim();

					// Prepare output
					const output: IDataObject = {
						response: messageContent,
					};

					// Add raw data if enabled
					if (includeRawOutput) {
						const rawMessages = [
							...messages,
							{
								role: 'assistant',
								content: messageContent,
								name: characterName,
							},
						];

						output.raw_data = rawMessages;
					}

					returnData.push({
						json: output,
						pairedItem: { item: i },
					});
				} else if (operation === 'custom') {
					// 对于custom操作，我们只需输出凭证信息供后续节点使用
					returnData.push({
						json: {
							apiKey: credentials.apiKey,
							baseUrl: baseUrl,
							providerType: providerType,
						},
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
