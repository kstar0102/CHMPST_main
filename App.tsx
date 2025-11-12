/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native'
import {createStackNavigator} from '@react-navigation/stack'
import {ToastProvider} from 'react-native-toast-notifications'
import CMConstants from './project/CMConstants';
import CMSplashScreen from './project/screens/CMSplashScreen';
import CMLoginScreen from './project/screens/CMLoginScreen';
import CMCoachStackNavigatorRoutes from './project/navigation/CMCoachStackNavigatorRoutes';
import FlashMessage from 'react-native-flash-message';
import CMRegisterScreen from './project/screens/CMRegisterScreen';
import CMNavigationStyle from './project/navigation/CMNavigationStyle';
import CMUtils from './project/utils/CMUtils';

const Stack = createStackNavigator()

const Auth = () => {
	const themeMode = CMConstants.themeMode.light

	return (
		<Stack.Navigator initialRouteName={CMConstants.screenName.login}>
			<Stack.Screen
				name={CMConstants.screenName.login}
				component={CMLoginScreen}
				options={{
					...CMNavigationStyle.header(themeMode),
					title: '',
					headerBackTitle: '',
					headerShown: true
				}}
			/>
			<Stack.Screen
				name={CMConstants.screenName.register}
				component={CMRegisterScreen}
				options={{
					...CMNavigationStyle.header(themeMode),
					title: '',
					headerBackTitle: '',
					headerShown: true
				}}
			/>
		</Stack.Navigator>
	)
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ToastProvider>
		<NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
			<Stack.Navigator initialRouteName={'Auth'}>
				<Stack.Screen
					name={CMConstants.screenName.splash}
					component={CMSplashScreen}
					options={{headerShown: false}}
				/>
				<Stack.Screen
					name="Auth"
					component={Auth}
					options={{headerShown: false}}
				/>
				<Stack.Screen
					name="CMCoachStackNavigatorRoutes"
					component={CMCoachStackNavigatorRoutes}
					options={{headerShown: false}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
		<FlashMessage position="top"/>
	</ToastProvider>

    // <View style={styles.container}>
    //   <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
    //   <NewAppScreen templateFileName="App.tsx" />
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App
