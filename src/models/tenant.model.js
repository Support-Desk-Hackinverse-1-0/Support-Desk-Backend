import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
      name: {
          type: String,
          required: [true, 'Tenant name is required'],
          trim: true,
          maxlength: [100, 'Tenant name cannot exceed 100 characters'],
      },
      slug: {
          type: String,
          required: [true, 'Slug is required'],
          unique: true,
          lowercase: true,
          trim: true,
      },
      supportEmail: {
          type: String,
          required: [true, 'Support email is required'],
          lowercase: true,
          match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      },
      aiContext: {
        type: [
          {
              url:{
                  type: String,
              }
          }
        ],
        default: []
      },
      integrations: {
          type: [
              {
                  name: { type: String, required: true },
                  baseUrl: { type: String, required: true },
                  auth: {
                      type: { type: String, enum: ['apiKey', 'bearer', 'none'], default: 'none' },
                      key: { type: String }, // Encrypted
                      headerName: { type: String } // e.g. "Authorization" or "x-api-key"
                  },
                  endpoints: [
                      {
                          name: { type: String, required: true }, // unique tool name
                          path: { type: String, required: true },
                          method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
                          description: { type: String, required: true },
                          params: [
                              {
                                  name: { type: String, required: true },
                                  type: { type: String, enum: ['string', 'number', 'boolean'], default: 'string' },
                                  required: { type: Boolean, default: false }
                              }
                          ]
                      }
                  ]
              }
          ],
          default: []
      }
    },
    { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);