/**
 * Response Helpers
 *
 * Standardized API response envelope used across all controllers.
 * Every response follows the same shape for consistency:
 *
 * Success: { success: true, data: {...}, meta: {...} }
 * Error:   { success: false, error: { code, message, status } }
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {object} data - Response payload
 * @param {object|null} meta - Optional pagination/metadata
 * @param {number} status - HTTP status code (default 200)
 */
const success = (res, data, meta = null, status = 200) => {
    const response = { success: true, data };
    if (meta) {
        response.meta = meta;
    }
    return res.status(status).json(response);
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {number} status - HTTP status code (default 400)
 */
const error = (res, code, message, status = 400) => {
    return res.status(status).json({
        success: false,
        error: { code, message, status },
    });
};

module.exports = { success, error };
