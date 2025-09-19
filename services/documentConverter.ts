import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ConversionResponse {
  content: string;
  metadata: {
    filename?: string;
    url?: string;
    size?: number;
    content_type?: string;
    format: string;
  };
  format: string;
  success: boolean;
  error?: string;
}

export class DocumentConverterService {
  private static instance: DocumentConverterService;

  static getInstance(): DocumentConverterService {
    if (!this.instance) {
      this.instance = new DocumentConverterService();
    }
    return this.instance;
  }

  async convertFile(file: File): Promise<ConversionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post<ConversionResponse>(
        `${API_BASE_URL}/api/convert/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error converting file:', error);
      throw new Error(error.response?.data?.detail || 'Failed to convert file');
    }
  }

  async convertYouTube(url: string): Promise<ConversionResponse> {
    try {
      const response = await axios.post<ConversionResponse>(
        `${API_BASE_URL}/api/convert/youtube`,
        { url }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error converting YouTube URL:', error);
      throw new Error(error.response?.data?.detail || 'Failed to convert YouTube video');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Parse markdown content into pages/sections
   * Splits by chapters or major sections for pagination
   */
  parseMarkdownToPages(markdown: string): string[] {
    // Split by headings (# or ##) to create natural page breaks
    const sections = markdown.split(/(?=^#{1,2}\s)/m);

    // Filter out empty sections and clean up
    const pages = sections
      .map(section => section.trim())
      .filter(section => section.length > 0);

    // If no sections found or only one section, split by paragraphs
    if (pages.length <= 1) {
      const paragraphs = markdown.split(/\n\n+/);
      const pageSize = 3000; // Characters per page
      const chunkedPages: string[] = [];
      let currentPage = '';

      for (const paragraph of paragraphs) {
        if (currentPage.length + paragraph.length > pageSize && currentPage.length > 0) {
          chunkedPages.push(currentPage.trim());
          currentPage = paragraph;
        } else {
          currentPage += (currentPage ? '\n\n' : '') + paragraph;
        }
      }

      if (currentPage) {
        chunkedPages.push(currentPage.trim());
      }

      return chunkedPages.length > 0 ? chunkedPages : [markdown];
    }

    return pages;
  }
}
