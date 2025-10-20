// http-config.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosInstance } from 'axios';

@Injectable()
export class HttpConfigService implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    const axiosRef: AxiosInstance = this.httpService.axiosRef;

    // Request interceptor
    axiosRef.interceptors.request.use(
      (config) => {
        // Add custom logic (e.g., auth tokens)
        return config;
      },
      (error) => {
        console.error('Request Error:', error.message);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    axiosRef.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED') {
          console.error('Request timed out:', error.config?.url);
        } else if (!error.response) {
          console.error('Network Error:', error.message);
        } else {
          const { status, data, config } = error.response;
          console.error(`API error [${status}] on ${config?.url}:`, data);
        }
        return Promise.reject(error);
      },
    );
  }

  // Expose HttpService for use in other services
  getHttpService(): HttpService {
    return this.httpService;
  }
}