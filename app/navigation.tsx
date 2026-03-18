import { LinkingOptions } from '@react-navigation/native';

//Defines structure of navigation stack and parameters
export type RootStackParamList = {
  Home: undefined;
  ResetPassword: undefined;
};

//Defines how to handle deep links
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['app://'],
  config: {
    screens: {
      ResetPassword: 'resetPassword',
    },
  },
};
