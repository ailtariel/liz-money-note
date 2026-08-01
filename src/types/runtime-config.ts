export interface RuntimeFeatureFlags extends Record<string, boolean> {
  enable_app_update: boolean;
  show_about: boolean;
}

export interface RuntimeAppConfig {
  app_title: string;
  api_base_url: string;
  update_manifest_url?: string;
  default_route: string;
  enable_route_guard: boolean;
  feature_flags: RuntimeFeatureFlags;
  vuetify: {
    default_theme: 'greenLight' | 'greenDark' | 'orangeLight' | 'orangeDark';
  };
  [key: string]: unknown;
}
