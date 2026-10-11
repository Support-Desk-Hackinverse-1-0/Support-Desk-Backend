import tenantModel from "../models/tenant.model.js";

/**
 * @param {Object} data={name, slug, supportEmail} - The tenant data to create
 * @returns {Promise<Object>} - The created tenant object
 */
export async function createTenant(data, session = null) {
    const options = session ? { session } : {};
    const tenant = await tenantModel.create([data], options);
    return tenant[0];
}

/**
 * @param {String} id - The ID of the tenant to retrieve
 * @returns {Promise<Object>} - The tenant object if found, otherwise null
 */
export async function getTenantById(id) {
    const tenant = await tenantModel.findById(id);
    return tenant;
}

/**
 * @param {String} slug - The slug of the tenant to retrieve
 * @returns {Promise<Object>} - The tenant object if found, otherwise null
 */
export async function getTenantBySlug(slug) {
    const tenant = await tenantModel.findOne({ slug });
    return tenant;
}

/**
 * @returns {Promise<Array>} - An array of all tenant objects
 */
export async function getAllTenants() {
    const tenants = await tenantModel.find();
    return tenants;
}


export async function addAIContext(tenantId, url) {
    const tenant = await tenantModel.findById(tenantId);
    if (!tenant) {
        throw new Error("Tenant not found");
    }
    // Initialize aiContext if it doesn't exist (for existing tenants)
    if (!tenant.aiContext) {
        tenant.aiContext = [];
    }
    tenant.aiContext.push({ url });
    await tenant.save();
    return tenant;
}