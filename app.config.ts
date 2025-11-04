import { ConfigContext, ExpoConfig } from 'expo/config';

const parseVersionCode = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveIosBuildNumber = (config: ConfigContext['config']): string => {
  const candidates = [
    process.env.IOS_BUILD_NUMBER,
    process.env.APP_IOS_BUILD_NUMBER,
    (config.ios as any)?.buildNumber,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.toString().trim();
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }

  return '1';
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV ?? 'development';
  const isPreviewBuild = appEnv === 'preview' || appEnv === 'testing';

  const baseName = 'Accountability';
  const name = isPreviewBuild ? `${baseName} Preview` : baseName;

  const version = process.env.APP_VERSION ?? config.version ?? '1.0.0';

  const iosBundleIdBase = process.env.IOS_BUNDLE_ID ?? 'com.accountability.app';
  const androidPackageBase = process.env.ANDROID_PACKAGE ?? 'com.accountability.app';

  const owner = process.env.EXPO_OWNER ?? 'parthagarwal00';

  const iosBundleIdentifier = isPreviewBuild ? `${iosBundleIdBase}.preview` : iosBundleIdBase;
  const androidPackage = isPreviewBuild ? `${androidPackageBase}.preview` : androidPackageBase;

  const iosBuildNumber = resolveIosBuildNumber(config);
  const androidVersionCode = parseVersionCode(process.env.ANDROID_VERSION_CODE, 1);


  console.log(
    `[Expo config] env=${appEnv} iosBundle=${iosBundleIdentifier} buildNumber=${iosBuildNumber} androidPackage=${androidPackage} versionCode=${androidVersionCode}`
  );

  const easProjectId =
    process.env.EAS_PROJECT_ID ?? '15d9d37c-3cf3-44ed-a1ab-9f07cd496f47';

  const extra: Record<string, any> = {
    appEnv,
    eas: {
      projectId: easProjectId,
    },
    backend: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasAnonKey: Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    },
  };

  return {
    ...config,
    name,
    owner,
    slug: 'accountability-app',
    version,
    scheme: 'accountability-app',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    updates: {
      url: `https://u.expo.dev/${easProjectId}`,
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: iosBuildNumber,
      infoPlist: {
        ...(config.ios as any)?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: androidPackage,
      versionCode: androidVersionCode,
    },
    web: {
      ...config.web,
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router'],
    extra,
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  };
};
