export interface RuntimeAppConfig {
  app_title: string;
  api_base_url: string;
  default_route: string;
  enable_route_guard: boolean;
  feature_flags: Record<string, boolean>;
  vuetify: {
    default_theme: 'greenLight' | 'greenDark' | 'orangeLight' | 'orangeDark';
  };
  [key: string]: unknown;
}
