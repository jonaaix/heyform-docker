"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AIResolver_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResolver = void 0;
const shared_types_enums_1 = require("@heyform-inc/shared-types-enums");
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const _config_1 = require("../../config");
const _decorator_1 = require("../../common/decorator");
const _graphql_1 = require("../../common/graphql");
const _guard_1 = require("../../common/guard");
const utils_1 = require("@heyform-inc/utils");
const _model_1 = require("../../model");
const graphql_1 = require("@nestjs/graphql");
const _service_1 = require("../../service");
const _utils_1 = require("../../utils");
const graphql_type_json_1 = require("graphql-type-json");
let AIResolver = AIResolver_1 = class AIResolver {
    constructor(openAIService, formService) {
        this.openAIService = openAIService;
        this.formService = formService;
        this.logger = new _utils_1.Logger(AIResolver_1.name);
    }
    async createFormWithAI(team, user, input) {
        var _a;
        if (!this.getPlan(team).aiForm) {
            throw new common_1.BadRequestException('Upgrade your plan to create form with AI');
        }
        const json = await this.createAIJson((0, _config_1.createFormPrompt)(input.topic, input.reference), 'Failed to generate question object');
        if (!utils_1.helper.isObject(json) || !utils_1.helper.isValidArray(json.fields)) {
            throw new common_1.InternalServerErrorException('Failed to generate question object');
        }
        return this.formService.create({
            teamId: team.id,
            projectId: input.projectId,
            memberId: user.id,
            name: utils_1.helper.isValid((_a = json.name) === null || _a === void 0 ? void 0 : _a.trim()) ? json.name.trim() : input.topic,
            fields: [],
            _drafts: JSON.stringify(json.fields),
            fieldsUpdatedAt: 0,
            settings: {
                active: false,
                captchaKind: shared_types_enums_1.CaptchaKindEnum.NONE,
                filterSpam: false,
                allowArchive: true,
                requirePassword: false,
                locale: 'en',
                enableQuestionList: true,
                enableNavigationArrows: true,
                enableEmailNotification: true
            },
            hiddenFields: [],
            version: 0,
            kind: shared_types_enums_1.FormKindEnum.SURVEY,
            interactiveMode: shared_types_enums_1.InteractiveModeEnum.GENERAL,
            status: shared_types_enums_1.FormStatusEnum.NORMAL
        });
    }
    async createFieldsWithAI(team, form, input) {
        if (!this.getPlan(team).aiForm) {
            throw new common_1.BadRequestException('Upgrade your plan to edit form with AI');
        }
        const fields = await this.createAIJson((0, _config_1.createFieldsPrompt)(form.name, (0, utils_1.parseJson)(form._drafts), input.prompt), 'Failed to create fields');
        if (!utils_1.helper.isValidArray(fields)) {
            throw new common_1.InternalServerErrorException('Failed to create fields');
        }
        return fields;
    }
    async createFormLogicsWithAI(team, form, input) {
        if (!this.getPlan(team).aiForm) {
            throw new common_1.BadRequestException('Upgrade your plan to setup logics with AI');
        }
        const logics = await this.createAIJson((0, _config_1.createLogicsPrompt)((0, utils_1.parseJson)(form._drafts), form.logics, input.prompt), 'Failed to generate logics');
        if (!utils_1.helper.isValidArray(logics)) {
            throw new common_1.InternalServerErrorException('Failed to generate logics');
        }
        return logics;
    }
    async createFormThemeWithAI(team, input) {
        const plan = this.getPlan(team);
        if (!plan.themeCustomization) {
            throw new common_1.BadRequestException('Upgrade your plan to setup theme customization');
        }
        if (!plan.aiForm) {
            throw new common_1.BadRequestException('Upgrade your plan to setup theme with AI');
        }
        const theme = await this.createAIJson((0, _config_1.createThemePrompt)(input.theme, input.prompt), 'Failed to create theme');
        if (!utils_1.helper.isObject(theme)) {
            throw new common_1.InternalServerErrorException('Failed to create theme');
        }
        return theme;
    }
    getPlan(team) {
        return { aiForm: true, themeCustomization: true };
    }
    async createAIJson(prompt, errorMessage) {
        var _a, _b;
        const result = await this.openAIService.chatCompletion({
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });
        const content = (_b = (_a = result.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        this.logger.info(content);
        if (utils_1.helper.isEmpty(content)) {
            throw new common_1.InternalServerErrorException(errorMessage);
        }
        try {
            return (0, _utils_1.parseAIJson)(content);
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException(errorMessage);
        }
    }
};
exports.AIResolver = AIResolver;
__decorate([
    (0, graphql_1.Mutation)(returns => String),
    (0, _decorator_1.ProjectGuard)(),
    (0, common_1.UseGuards)(_guard_1.GqlThrottlerGuard),
    (0, throttler_1.Throttle)({
        default: {
            limit: 10,
            ttl: (0, utils_1.hs)('1h')
        }
    }),
    __param(0, (0, _decorator_1.Team)()),
    __param(1, (0, _decorator_1.User)()),
    __param(2, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [_model_1.TeamModel,
        _model_1.UserModel,
        _graphql_1.CreateFormWithAIInput]),
    __metadata("design:returntype", Promise)
], AIResolver.prototype, "createFormWithAI", null);
__decorate([
    (0, graphql_1.Mutation)(returns => [graphql_type_json_1.GraphQLJSONObject]),
    (0, _decorator_1.FormGuard)(),
    __param(0, (0, _decorator_1.Team)()),
    __param(1, (0, _decorator_1.Form)()),
    __param(2, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [_model_1.TeamModel,
        _model_1.FormModel,
        _graphql_1.CreateFieldsWithAIInput]),
    __metadata("design:returntype", Promise)
], AIResolver.prototype, "createFieldsWithAI", null);
__decorate([
    (0, graphql_1.Mutation)(returns => [graphql_type_json_1.GraphQLJSONObject]),
    (0, _decorator_1.FormGuard)(),
    __param(0, (0, _decorator_1.Team)()),
    __param(1, (0, _decorator_1.Form)()),
    __param(2, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [_model_1.TeamModel,
        _model_1.FormModel,
        _graphql_1.CreateFieldsWithAIInput]),
    __metadata("design:returntype", Promise)
], AIResolver.prototype, "createFormLogicsWithAI", null);
__decorate([
    (0, graphql_1.Mutation)(returns => graphql_type_json_1.GraphQLJSONObject),
    (0, _decorator_1.FormGuard)(),
    __param(0, (0, _decorator_1.Team)()),
    __param(1, (0, graphql_1.Args)('input')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [_model_1.TeamModel,
        _graphql_1.CreateFormThemeWithAIInput]),
    __metadata("design:returntype", Promise)
], AIResolver.prototype, "createFormThemeWithAI", null);
exports.AIResolver = AIResolver = AIResolver_1 = __decorate([
    (0, graphql_1.Resolver)(),
    (0, _decorator_1.Auth)(),
    __metadata("design:paramtypes", [_service_1.OpenAIService,
        _service_1.FormService])
], AIResolver);
//# sourceMappingURL=ai.resolver.js.map
