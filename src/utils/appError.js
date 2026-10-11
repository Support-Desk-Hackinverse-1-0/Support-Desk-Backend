/** 
 * @description Custom application error. 
 * @extends Error
 */
export default class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}