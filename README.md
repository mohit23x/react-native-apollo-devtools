## React Native Apollo Devtools

### Installation

1. Add these lines in the package.json as devDependencies

```
    "react-native-apollo-devtools": "https://github.com/mohit23x/react-native-apollo-devtools.git#4efe5b63ef5911b66fed6144259b94292cdd6d2b",
    "react-native-flipper": "^0.131.1",
```

2. In the `wrapper.tsx` file, add this lines, here the `client` is our apollo client exported from `apolloConfig.native.ts` file 

```
import { apolloDevToolsInit } from 'react-native-apollo-devtools/packages/react-native-apollo-devtools-client';

if(__DEV__){
    apolloDevToolsInit(client, {});
}

```

3. Install Flipper in your system, and make sure the emulator/device is recognized by flipper by setting up proper SDK path


4. Go to `plugins manager` -> `install plugin` -> `import plugin` (at the bottom)

download [this file](https://github.com/mohit23x/react-native-apollo-devtools/raw/master/packages/flipper-plugin-react-native-apollo-devtools/flipper-plugin-react-native-apollo-devtools-v1.0.0.tgz) and import it 

5. Click `install` and restart Flipper

6. Launch app and you should see `Apollo Devtools` in the list of plugin in disable section, Click `+` icon to enable it 

![image](https://user-images.githubusercontent.com/36567063/153851206-33074526-329c-4b82-87c7-18c59d963649.png)

