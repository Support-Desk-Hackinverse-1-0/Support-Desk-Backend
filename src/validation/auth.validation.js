import { body } from 'express-validator';
import validateRequest from '../utils/validate.js';

export const tenantOnboardingValidation = [
	body('name')// tenant name/company name
		.trim()
		.notEmpty().withMessage('Tenant name is required')
		.isLength({ max: 100 }).withMessage('Tenant name cannot exceed 100 characters'),

	body('slug')
		.trim()
		.notEmpty().withMessage('Slug is required')
		.matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
		.isLength({ max: 100 }).withMessage('Slug cannot exceed 100 characters'),

	body('supportEmail')
		.trim()
		.notEmpty().withMessage('Support email is required')
		.isEmail().withMessage('Please provide a valid support email')
		.normalizeEmail(),


	body('adminName')
		.trim()
		.notEmpty().withMessage('Admin name is required')
		.isLength({ max: 100 }).withMessage('Admin name cannot exceed 100 characters'),

	body('adminEmail')
		.trim()
		.notEmpty().withMessage('Admin email is required')
		.isEmail().withMessage('Please provide a valid admin email')
		.normalizeEmail(),

	body('password')
		.notEmpty().withMessage('Password is required')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    validateRequest,
];

export const registerValidation = [
	body('name')
		.trim()
		.notEmpty().withMessage('Name is required')
		.isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),

	body('email')
		.trim()
		.notEmpty().withMessage('Email is required')
		.isEmail().withMessage('Please provide a valid email')
		.normalizeEmail(),

	body('password')
		.notEmpty().withMessage('Password is required')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

	body('tenantId')
		.notEmpty().withMessage('Tenant ID is required')
		.isMongoId().withMessage('Please provide a valid tenant ID'),

	validateRequest,
];

export const loginValidation = [
	body('email')
		.trim()
		.notEmpty().withMessage('Email is required')
		.isEmail().withMessage('Please provide a valid email')
		.normalizeEmail(),

	body('password')
		.notEmpty().withMessage('Password is required'),

	validateRequest,
];

export const updatePasswordValidation = [
	body('oldPassword')
	  .notEmpty().withMessage('Old password is required'),
  
	body('newPassword')
	  .notEmpty().withMessage('New password is required')
	  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
	validateRequest,
  ];