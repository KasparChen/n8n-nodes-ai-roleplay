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
// 导入package.json获取版本号
// @ts-ignore
import { version } from '../../package.json';

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
		displayName: `Roleplay AI v${version}`,
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
				displayName: 'Chat Summary',
				name: 'chatSummary',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '',
				description: 'Summary of the chat history that will be inserted after the first message in format {"system":"{chat_summary}"}. Leave empty to omit.',
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
				default: '[]',
				typeOptions: {
					rows: 5,
				},
				description: 'JSON formatted chat history with role (user/assistant), content (message text) and name (optional) fields. Leave empty to omit.',
				displayOptions: {
					show: {
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
				displayName: 'Include Request Log',
				name: 'includeRequestLog',
				type: 'boolean',
				default: false,
				description: 'Whether to include request configuration in the output',
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
				displayName: 'Extra Body',
				name: 'includeExtraBody',
				type: 'boolean',
				default: false,
				description: 'Whether to include extra body parameters for specific models',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
					},
				},
			},
			{
				displayName: 'Extra Body Content',
				name: 'extraBodyContent',
				type: 'string',
				typeOptions: {
					rows: 3,
				},
				default: '"enable_thinking": true,\n"thinking_budget": 50',
				description: 'Speciallize for Qwen3-like models with extra settings, only enter content inside { }. Note: Use true/false (lowercase) for boolean values. For Ollama, these options will be nested under an "options" object (e.g. "seed": 101, "temperature": 0). For OpenAI/Anthropic, these options are top-level.',
				displayOptions: {
					show: {
						operation: [
							'chat',
						],
						includeExtraBody: [
							true,
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
					'Content-Type': 'application/json',
				};

				// 添加Anthropic特定的header
				if (providerType === 'anthropic') {
					headers['anthropic-version'] = '2023-06-01';
					headers['x-api-key'] = credentials.apiKey;
				}

				let url = `${baseUrl}/models`;
				if (providerType === 'ollama') {
					url = `${baseUrl}/api/tags`;
					delete headers.Authorization; // Ollama不需要认证头来获取模型列表
					if (credentials.apiKey) {
						headers.Authorization = `Bearer ${credentials.apiKey}`;
					}
				}

				const options: IHttpRequestOptions = {
					url,
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
						// Anthropic格式 or Ollama /api/tags 格式
						modelData = response.models;
					} else if (providerType === 'ollama' && response.models && Array.isArray(response.models)) {
						// Ollama /api/tags specific handling if needed, though current structure should work
						modelData = response.models.map((model: any) => ({ id: model.name, name: model.name, description: model.details?.family || '' }));
					} else {
						// 如果无法识别格式，尝试自动检测数组字段
						for (const key in response) {
							if (Array.isArray(response[key])) {
								const firstItem = response[key][0];
								// 检查数组元素是否有id字段，这通常表示它是模型列表
								if (firstItem && typeof firstItem === 'object' && ('id' in firstItem || (providerType === 'ollama' && 'name' in firstItem))) {
									modelData = response[key];
									break;
								}
							}
						}
					}

					if (modelData.length === 0 && providerType === 'ollama' && response.models && Array.isArray(response.models)) {
						// Fallback for Ollama if the initial generic parsing didn't catch it, map `name` to `id`
						modelData = response.models.map((model: any) => ({ id: model.name, name: model.name, description: model.details?.family || '' }));
					}

					if (modelData.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not find any models in the API response',
						);
					}

					const models = modelData
						.filter((model: IRoleplayAIModel) => model.id || (providerType === 'ollama' && (model as any).name))
						.map((model: IRoleplayAIModel) => ({
							name: model.name || model.id,
							value: model.id || (model as any).name, // Use name as value for Ollama if id is not present
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

					// 安全获取chatSummary，确保处理null或undefined
					let chatSummary = '';
					try {
						const chatSummaryValue = this.getNodeParameter('chatSummary', i, '');
						if (chatSummaryValue !== null && chatSummaryValue !== undefined) {
							chatSummary = String(chatSummaryValue);
						}
					} catch (error) {
						// 如果出错，使用默认空字符串
					}

					let chatHistory = [];
					try {
						// 获取原始值
						const chatHistoryValue = this.getNodeParameter('chatHistory', i, '[]');

						if (chatHistoryValue !== null && chatHistoryValue !== undefined) {
							let processedValue;

							// 如果已经是对象(包括数组)
							if (typeof chatHistoryValue === 'object') {
								processedValue = chatHistoryValue;
							} else {
								// 如果是字符串，尝试解析JSON
								const chatHistoryStr = String(chatHistoryValue);
								if (chatHistoryStr && chatHistoryStr.trim() !== '' && chatHistoryStr !== '[]') {
									processedValue = JSON.parse(chatHistoryStr);
								}
							}

							// 处理提取的值
							if (processedValue) {
								// 检查是否是[{submit_history:[...]}]格式
								if (Array.isArray(processedValue) && processedValue.length > 0 &&
									typeof processedValue[0] === 'object' && processedValue[0] !== null &&
									'submit_history' in processedValue[0] && Array.isArray(processedValue[0].submit_history)) {
									chatHistory = processedValue[0].submit_history;
								}
								// 检查是否是直接的对话数组格式
								else if (Array.isArray(processedValue)) {
									chatHistory = processedValue;
								}
							}
						}
					} catch (error) {
						throw new NodeOperationError(
							this.getNode(),
							`Invalid chat history format: ${(error as Error).message}`,
						);
					}

					const includeOtherPreMsg = this.getNodeParameter('includeOtherPreMsg', i) as boolean;
					const otherPreMsg = includeOtherPreMsg ? this.getNodeParameter('otherPreMsg', i, '') as string : '';

					const message = this.getNodeParameter('message', i) as string;
					const includeRawOutput = this.getNodeParameter('includeRawOutput', i) as boolean;
					const includeRequestLog = this.getNodeParameter('includeRequestLog', i) as boolean;
					const temperature = this.getNodeParameter('temperature', i) as number;
					const includeExtraBody = this.getNodeParameter('includeExtraBody', i) as boolean;
					const extraBodyContent = this.getNodeParameter('extraBodyContent', i) as string;
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

					// Add chat summary if not empty (ignoring leading whitespace)
					if (chatSummary && typeof chatSummary === 'string' && chatSummary.trimStart()) {
						messages.push({
							role: 'system',
							content: `${chatSummary}`,
						});
					}

					// Add chat history if not empty
					if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
						// 逐个检查并添加chat history的每个消息
						for (const entry of chatHistory) {
							if (entry && typeof entry === 'object' && 'role' in entry && 'content' in entry) {
								messages.push(entry);
							}
						}
					}

					// Add user message
					messages.push({
						role: 'user',
						content: message,
					});

					// 构建基础请求体
					const baseRequestBody = {
						model: modelId,
						messages,
						temperature,
						...additionalFields,
					};

					// 如果启用了 Extra Body，添加到请求体中
					if (includeExtraBody && extraBodyContent) {
						try {
							// 将 Python 风格的布尔值转换为 JSON 风格
							const pythonToJsonContent = extraBodyContent
								.replace(/\bTrue\b/g, 'true')
								.replace(/\bFalse\b/g, 'false');

							// 解析用户输入的参数
							const extraParams = JSON.parse(`{${pythonToJsonContent}}`);

							// 创建最终的请求体，将参数作为顶级参数
							const requestBody = {
								...baseRequestBody,
								...extraParams,  // 直接展开参数到顶级
							};

							// 输出最终发送给 LLM 的内容
							console.log('Final request body:', JSON.stringify(requestBody, null, 2));

							// 创建请求头
							const headers: IDataObject = {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							};

							// 为Anthropic添加特定的header
							if (providerType === 'anthropic') {
								headers['anthropic-version'] = '2023-06-01';
								headers['x-api-key'] = credentials.apiKey;
							}

							let url = `${baseUrl}/chat/completions`;
							if (providerType === 'ollama') {
								url = `${baseUrl}/api/chat`;
								// Ollama不需要这些特定的headers
								delete headers['HTTP-Referer'];
								delete headers['X-Title'];
								// 根据 API Key 是否存在来决定是否包含 Authorization 头
								if (credentials.apiKey) {
									headers.Authorization = `Bearer ${credentials.apiKey}`;
								} else {
									delete headers.Authorization;
								}
							}

							let finalRequestBody;
							if (providerType === 'ollama') {
								const ollamaOptions: IDataObject = { ...additionalFields, temperature };
								let parsedExtraBodyParams: IDataObject = {};

								if (includeExtraBody && extraBodyContent) {
									try {
										const pythonToJsonContent = extraBodyContent
											.replace(/\bTrue\b/g, 'true')
											.replace(/\bFalse\b/g, 'false');
										parsedExtraBodyParams = JSON.parse(`{${pythonToJsonContent}}`);
									} catch (error) {
										throw new NodeOperationError(
											this.getNode(),
											`Invalid Extra Body content format for Ollama: ${(error as Error).message}. Please use true/false (lowercase) for boolean values and ensure valid JSON content.`,
										);
									}
								}
								finalRequestBody = {
									model: modelId,
									messages,
									options: ollamaOptions,
									stream: false, // Ollama 需要明确指定 stream: false 以获得完整响应
									...parsedExtraBodyParams, // 将解析后的 extra body 参数扩展到顶层
								};
							} else {
								// OpenAI/Anthropic 请求体构建逻辑
								const requestBody = {
									...baseRequestBody,
								};
								if (includeExtraBody && extraBodyContent) {
									try {
										const pythonToJsonContent = extraBodyContent
											.replace(/\bTrue\b/g, 'true')
											.replace(/\bFalse\b/g, 'false');
										const extraParams = JSON.parse(`{${pythonToJsonContent}}`);
										Object.assign(requestBody, extraParams);
									} catch (error) {
										throw new NodeOperationError(
											this.getNode(),
											`Invalid Extra Body content format: ${(error as Error).message}. Please use true/false (lowercase) for boolean values.`,
										);
									}
								}
								finalRequestBody = requestBody;
							}

							// 输出最终发送给 LLM 的内容
							console.log('Final request body:', JSON.stringify(finalRequestBody, null, 2));

							const options: IHttpRequestOptions = {
								url,
								headers,
								method: 'POST' as IHttpRequestMethods,
								body: finalRequestBody,
								json: true,
							};

							const response = await this.helpers.request(options);

							let messageContent;
							if (providerType === 'ollama') {
								if (!response?.message?.content) {
									throw new NodeOperationError(
										this.getNode(),
										'Invalid response format from Ollama API (expected message.content)',
									);
								}
								messageContent = response.message.content.trim();
							} else {
								if (!response?.choices?.[0]?.message?.content) {
									throw new NodeOperationError(
										this.getNode(),
										'Invalid response format from AI API (expected choices[0].message.content)',
									);
								}
								const typedResponse = response as IRoleplayAIResponse;
								messageContent = typedResponse.choices[0].message.content.trim();
							}

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

							// Add request log if enabled
							if (includeRequestLog) {
								const logData = {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
										...(providerType === 'anthropic' ? {
											'anthropic-version': '2023-06-01',
											'x-api-key': credentials.apiKey,
										} : {}),
										...(providerType === 'ollama' ? (credentials.apiKey ? { Authorization: `Bearer ${credentials.apiKey}` } : {}) : { // For non-Ollama, or Ollama with API key
											Authorization: `Bearer ${credentials.apiKey}`,
											'HTTP-Referer': 'https://github.com/kasparchen/n8n-nodes-ai-roleplay',
											'X-Title': 'n8n Roleplay AI Node',
										}),
									},
									body: {
										...finalRequestBody,
										messages: '[...]', // 使用省略号代替实际消息内容
									},
								};
								output.log = logData;
							}

							returnData.push({
								json: output,
								pairedItem: { item: i },
							});
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`Invalid Extra Body content format: ${(error as Error).message}. Please use true/false (lowercase) for boolean values.`,
							);
						}
					} else {
						// 如果没有启用 Extra Body，使用基础请求体
						const requestBody = baseRequestBody;

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
						// 为Ollama处理headers (如果需要，虽然大部分已在外部处理)
						if (providerType === 'ollama') {
							delete headers['HTTP-Referer'];
							delete headers['X-Title'];
							if (!credentials.apiKey) {
								delete headers.Authorization;
							}
						}

						let url = `${baseUrl}/chat/completions`;
						if (providerType === 'ollama') {
							url = `${baseUrl}/api/chat`;
						}

						const options: IHttpRequestOptions = {
							url,
							headers,
							method: 'POST' as IHttpRequestMethods,
							body: requestBody, // This should be finalRequestBody or a similar structure if we follow the pattern
							json: true,
						};

						const response = await this.helpers.request(options);

						let messageContent;
						if (providerType === 'ollama') {
							if (!response?.message?.content) {
								throw new NodeOperationError(
									this.getNode(),
									'Invalid response format from Ollama API (expected message.content)',
								);
							}
							messageContent = response.message.content.trim();
						} else {
							if (!response?.choices?.[0]?.message?.content) {
								throw new NodeOperationError(
									this.getNode(),
									'Invalid response format from AI API (expected choices[0].message.content)',
								);
							}
							const typedResponse = response as IRoleplayAIResponse;
							messageContent = typedResponse.choices[0].message.content.trim();
						}

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

						// Add request log if enabled
						if (includeRequestLog) {
							const logData = {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									...(providerType === 'anthropic' ? {
										'anthropic-version': '2023-06-01',
										'x-api-key': credentials.apiKey,
									} : {}),
									...(providerType === 'ollama' ? (credentials.apiKey ? { Authorization: `Bearer ${credentials.apiKey}` } : {}) : { // For non-Ollama, or Ollama with API key
										Authorization: `Bearer ${credentials.apiKey}`,
										'HTTP-Referer': 'https://github.com/kasparchen/n8n-nodes-ai-roleplay',
										'X-Title': 'n8n Roleplay AI Node',
									}),
								},
								body: {
									...requestBody, // or finalRequestBody if we are in the non-extra-body path
									messages: '[...]', // 使用省略号代替实际消息内容
								},
							};
							output.log = logData;
						}

						returnData.push({
							json: output,
							pairedItem: { item: i },
						});
					}
				} else if (operation === 'custom') {
					// ... existing custom API call logic ...
				}
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Error executing operation: ${(error as Error).message}`);
			}
		}

		return [returnData];
	}
}