"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KPITrend = exports.KPIPeriod = exports.FormTemplateStatus = exports.FormFieldType = exports.SignatureStatus = exports.CertificationStatus = exports.RiskLevel = exports.NotificationType = exports.DocumentStatus = exports.DocumentCategory = exports.ContractStatus = exports.ProviderStatus = exports.ProviderType = exports.MaintenanceStatus = exports.MaintenanceType = exports.InventoryTransactionType = exports.InventoryItemStatus = exports.EquipmentCategory = exports.EquipmentCondition = exports.EquipmentStatus = exports.Priority = exports.RequestChannel = exports.RequestStatus = exports.RequestType = exports.TaskStatus = exports.ProjectStatus = exports.UserStatus = exports.UserRole = void 0;
// Enums corrigés selon le schéma Prisma
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PROJECT_MANAGER"] = "PROJECT_MANAGER";
    UserRole["SUPERVISOR"] = "SUPERVISOR";
    UserRole["TECHNICIAN"] = "TECHNICIAN";
    UserRole["CONTRACTOR"] = "CONTRACTOR";
    UserRole["CLIENT"] = "CLIENT";
    UserRole["GOVERNMENT"] = "GOVERNMENT";
    UserRole["CALL_CENTER"] = "CALL_CENTER";
    UserRole["AUDITOR"] = "AUDITOR";
    UserRole["CITIZEN"] = "CITIZEN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["PENDING"] = "PENDING";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNED"] = "PLANNED";
    ProjectStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProjectStatus["ON_HOLD"] = "ON_HOLD";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["CANCELLED"] = "CANCELLED";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["ASSIGNED"] = "ASSIGNED";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["REJECTED"] = "REJECTED";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var RequestType;
(function (RequestType) {
    RequestType["CONNECTION"] = "CONNECTION";
    RequestType["INCIDENT"] = "INCIDENT";
    RequestType["AUDIT"] = "AUDIT";
    RequestType["INSPECTION"] = "INSPECTION";
    RequestType["MAINTENANCE"] = "MAINTENANCE";
    RequestType["OTHER"] = "OTHER";
})(RequestType || (exports.RequestType = RequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUBMITTED"] = "SUBMITTED";
    RequestStatus["ANALYZING"] = "ANALYZING";
    RequestStatus["VALIDATED"] = "VALIDATED";
    RequestStatus["ASSIGNED"] = "ASSIGNED";
    RequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RequestStatus["COMPLETED"] = "COMPLETED";
    RequestStatus["REJECTED"] = "REJECTED";
    RequestStatus["CANCELLED"] = "CANCELLED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var RequestChannel;
(function (RequestChannel) {
    RequestChannel["APP"] = "APP";
    RequestChannel["WEBSITE"] = "WEBSITE";
    RequestChannel["API"] = "API";
    RequestChannel["CALL_CENTER"] = "CALL_CENTER";
    RequestChannel["FIELD_AGENT"] = "FIELD_AGENT";
})(RequestChannel || (exports.RequestChannel = RequestChannel = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["HIGH"] = "HIGH";
    Priority["CRITICAL"] = "CRITICAL";
})(Priority || (exports.Priority = Priority = {}));
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["AVAILABLE"] = "AVAILABLE";
    EquipmentStatus["IN_USE"] = "IN_USE";
    EquipmentStatus["MAINTENANCE"] = "MAINTENANCE";
    EquipmentStatus["REPAIR"] = "REPAIR";
    EquipmentStatus["DEFECTIVE"] = "DEFECTIVE";
    EquipmentStatus["LOST"] = "LOST";
    EquipmentStatus["RETIRED"] = "RETIRED";
    EquipmentStatus["RESERVED"] = "RESERVED";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
var EquipmentCondition;
(function (EquipmentCondition) {
    EquipmentCondition["NEW"] = "NEW";
    EquipmentCondition["EXCELLENT"] = "EXCELLENT";
    EquipmentCondition["GOOD"] = "GOOD";
    EquipmentCondition["FAIR"] = "FAIR";
    EquipmentCondition["POOR"] = "POOR";
    EquipmentCondition["DAMAGED"] = "DAMAGED";
})(EquipmentCondition || (exports.EquipmentCondition = EquipmentCondition = {}));
var EquipmentCategory;
(function (EquipmentCategory) {
    EquipmentCategory["ELECTRICAL"] = "ELECTRICAL";
    EquipmentCategory["ELECTRONIC"] = "ELECTRONIC";
    EquipmentCategory["MECHANICAL"] = "MECHANICAL";
    EquipmentCategory["IT"] = "IT";
    EquipmentCategory["SAFETY"] = "SAFETY";
    EquipmentCategory["MEASUREMENT"] = "MEASUREMENT";
    EquipmentCategory["CONSTRUCTION"] = "CONSTRUCTION";
    EquipmentCategory["VEHICLE"] = "VEHICLE";
    EquipmentCategory["POWER"] = "POWER";
    EquipmentCategory["OFFICE"] = "OFFICE";
    EquipmentCategory["OTHER"] = "OTHER";
})(EquipmentCategory || (exports.EquipmentCategory = EquipmentCategory = {}));
var InventoryItemStatus;
(function (InventoryItemStatus) {
    InventoryItemStatus["IN_STOCK"] = "IN_STOCK";
    InventoryItemStatus["LOW_STOCK"] = "LOW_STOCK";
    InventoryItemStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    InventoryItemStatus["DISCONTINUED"] = "DISCONTINUED";
    InventoryItemStatus["ON_ORDER"] = "ON_ORDER";
    InventoryItemStatus["RESERVED"] = "RESERVED";
})(InventoryItemStatus || (exports.InventoryItemStatus = InventoryItemStatus = {}));
var InventoryTransactionType;
(function (InventoryTransactionType) {
    InventoryTransactionType["RECEIPT"] = "RECEIPT";
    InventoryTransactionType["ISSUE"] = "ISSUE";
    InventoryTransactionType["TRANSFER"] = "TRANSFER";
    InventoryTransactionType["RETURN"] = "RETURN";
    InventoryTransactionType["ADJUSTMENT"] = "ADJUSTMENT";
    InventoryTransactionType["COUNT"] = "COUNT";
    InventoryTransactionType["WRITE_OFF"] = "WRITE_OFF";
})(InventoryTransactionType || (exports.InventoryTransactionType = InventoryTransactionType = {}));
var MaintenanceType;
(function (MaintenanceType) {
    MaintenanceType["PREVENTIVE"] = "PREVENTIVE";
    MaintenanceType["CORRECTIVE"] = "CORRECTIVE";
    MaintenanceType["INSPECTION"] = "INSPECTION";
    MaintenanceType["CALIBRATION"] = "CALIBRATION";
    MaintenanceType["UPGRADE"] = "UPGRADE";
    MaintenanceType["OTHER"] = "OTHER";
})(MaintenanceType || (exports.MaintenanceType = MaintenanceType = {}));
var MaintenanceStatus;
(function (MaintenanceStatus) {
    MaintenanceStatus["SCHEDULED"] = "SCHEDULED";
    MaintenanceStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MaintenanceStatus["COMPLETED"] = "COMPLETED";
    MaintenanceStatus["CANCELLED"] = "CANCELLED";
    MaintenanceStatus["PENDING_PARTS"] = "PENDING_PARTS";
    MaintenanceStatus["DELAYED"] = "DELAYED";
})(MaintenanceStatus || (exports.MaintenanceStatus = MaintenanceStatus = {}));
var ProviderType;
(function (ProviderType) {
    ProviderType["ENTERPRISE"] = "ENTERPRISE";
    ProviderType["SMALL_BUSINESS"] = "SMALL_BUSINESS";
    ProviderType["FREELANCE"] = "FREELANCE";
    ProviderType["COOPERATIVE"] = "COOPERATIVE";
    ProviderType["NGO"] = "NGO";
    ProviderType["GOVERNMENT"] = "GOVERNMENT";
    ProviderType["OTHER"] = "OTHER";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
var ProviderStatus;
(function (ProviderStatus) {
    ProviderStatus["ACTIVE"] = "ACTIVE";
    ProviderStatus["INACTIVE"] = "INACTIVE";
    ProviderStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
    ProviderStatus["SUSPENDED"] = "SUSPENDED";
    ProviderStatus["BLACKLISTED"] = "BLACKLISTED";
})(ProviderStatus || (exports.ProviderStatus = ProviderStatus = {}));
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["DRAFT"] = "DRAFT";
    ContractStatus["PENDING_SIGNATURE"] = "PENDING_SIGNATURE";
    ContractStatus["SIGNED"] = "SIGNED";
    ContractStatus["ACTIVE"] = "ACTIVE";
    ContractStatus["COMPLETED"] = "COMPLETED";
    ContractStatus["TERMINATED"] = "TERMINATED";
    ContractStatus["EXPIRED"] = "EXPIRED";
    ContractStatus["CANCELLED"] = "CANCELLED";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
var DocumentCategory;
(function (DocumentCategory) {
    DocumentCategory["CONTRACT"] = "CONTRACT";
    DocumentCategory["REPORT"] = "REPORT";
    DocumentCategory["PHOTO"] = "PHOTO";
    DocumentCategory["NOTE"] = "NOTE";
    DocumentCategory["INVOICE"] = "INVOICE";
    DocumentCategory["CERTIFICATE"] = "CERTIFICATE";
    DocumentCategory["REGULATORY"] = "REGULATORY";
    DocumentCategory["OTHER"] = "OTHER";
})(DocumentCategory || (exports.DocumentCategory = DocumentCategory = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["DRAFT"] = "DRAFT";
    DocumentStatus["SUBMITTED"] = "SUBMITTED";
    DocumentStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["ARCHIVED"] = "ARCHIVED";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["ALERT"] = "ALERT";
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["TASK_ASSIGNMENT"] = "TASK_ASSIGNMENT";
    NotificationType["REQUEST_UPDATE"] = "REQUEST_UPDATE";
    NotificationType["DOCUMENT_UPDATE"] = "DOCUMENT_UPDATE";
    NotificationType["DEADLINE"] = "DEADLINE";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var CertificationStatus;
(function (CertificationStatus) {
    CertificationStatus["VALID"] = "VALID";
    CertificationStatus["EXPIRED"] = "EXPIRED";
    CertificationStatus["REVOKED"] = "REVOKED";
})(CertificationStatus || (exports.CertificationStatus = CertificationStatus = {}));
var SignatureStatus;
(function (SignatureStatus) {
    SignatureStatus["PENDING"] = "PENDING";
    SignatureStatus["SIGNED"] = "SIGNED";
    SignatureStatus["REJECTED"] = "REJECTED";
    SignatureStatus["EXPIRED"] = "EXPIRED";
})(SignatureStatus || (exports.SignatureStatus = SignatureStatus = {}));
var FormFieldType;
(function (FormFieldType) {
    FormFieldType["TEXT"] = "TEXT";
    FormFieldType["TEXTAREA"] = "TEXTAREA";
    FormFieldType["NUMBER"] = "NUMBER";
    FormFieldType["DATE"] = "DATE";
    FormFieldType["TIME"] = "TIME";
    FormFieldType["DATETIME"] = "DATETIME";
    FormFieldType["SELECT"] = "SELECT";
    FormFieldType["MULTISELECT"] = "MULTISELECT";
    FormFieldType["CHECKBOX"] = "CHECKBOX";
    FormFieldType["RADIO"] = "RADIO";
    FormFieldType["FILE"] = "FILE";
    FormFieldType["IMAGE"] = "IMAGE";
    FormFieldType["LOCATION"] = "LOCATION";
    FormFieldType["SIGNATURE"] = "SIGNATURE";
    FormFieldType["BARCODE"] = "BARCODE";
    FormFieldType["QRCODE"] = "QRCODE";
})(FormFieldType || (exports.FormFieldType = FormFieldType = {}));
var FormTemplateStatus;
(function (FormTemplateStatus) {
    FormTemplateStatus["ACTIVE"] = "ACTIVE";
    FormTemplateStatus["DRAFT"] = "DRAFT";
    FormTemplateStatus["ARCHIVED"] = "ARCHIVED";
})(FormTemplateStatus || (exports.FormTemplateStatus = FormTemplateStatus = {}));
var KPIPeriod;
(function (KPIPeriod) {
    KPIPeriod["DAILY"] = "DAILY";
    KPIPeriod["WEEKLY"] = "WEEKLY";
    KPIPeriod["MONTHLY"] = "MONTHLY";
    KPIPeriod["QUARTERLY"] = "QUARTERLY";
    KPIPeriod["YEARLY"] = "YEARLY";
})(KPIPeriod || (exports.KPIPeriod = KPIPeriod = {}));
var KPITrend;
(function (KPITrend) {
    KPITrend["UP"] = "UP";
    KPITrend["DOWN"] = "DOWN";
    KPITrend["STABLE"] = "STABLE";
})(KPITrend || (exports.KPITrend = KPITrend = {}));
