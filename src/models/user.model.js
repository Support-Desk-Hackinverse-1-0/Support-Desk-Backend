import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
      name: {
          type: String,
          required: [true, 'User name is required'],
          trim: true,
          maxlength: [100, 'Name cannot exceed 100 characters'],
      },
      email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true,
          lowercase: true,
          match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      },
      password: {
          type: String,
          required: [true, 'Password is required'],
          minlength: [6, 'Password must be at least 6 characters long'],
          select: false,
      },
      role: {
          type: String,
          enum: {
            values: ['admin', 'agent'],
            message: 'Role must be either admin or agent',
          },
          required: [true, 'Role is required'],
      },
      tenantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Tenant',
          required: [true, 'Tenant ID is required'],
      },
      isApproved: {
          type: Boolean,
          default: function () {
            return this.role === 'admin';
          },
      },
      isOnline: {
          type: Boolean,
          default: false,
      },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        return;
    }
    try{
        this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
        throw new Error("Error hashing password");
    }
});

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error("Error comparing passwords");
    }
};

export default mongoose.model('User', userSchema);
