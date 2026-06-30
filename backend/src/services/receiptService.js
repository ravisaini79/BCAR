const { generateReceiptPDF } = require('./pdfGenerator');

/**
 * Service to manage receipt generation.
 */
class ReceiptService {
  /**
   * Generates a PDF receipt buffer for a given member.
   * @param {Object} member - The member document details.
   * @returns {Promise<Buffer>}
   */
  async generateReceiptBuffer(member) {
    try {
      const buffer = await generateReceiptPDF(member);
      return buffer;
    } catch (error) {
      console.error(`ReceiptService Error: Failed to generate PDF for ${member.email}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReceiptService();
