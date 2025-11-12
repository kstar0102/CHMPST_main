import React, {useState, useEffect, createRef} from 'react'
import {View, TouchableOpacity, SafeAreaView, Text, TextStyle, Keyboard, ViewStyle} from 'react-native'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import CMRipple from '../components/CMRipple'
import CMConstants from '../CMConstants'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import CMUtils from '../utils/CMUtils'
import { TextInput } from 'react-native-gesture-handler'
import CMUIHelper from '../helper/CMUIHelper'
import CMLocalStorageHelper from '../helper/CMLocalStorageHelper'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMGlobal from '../CMGlobal'

const CMLoginScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const passwordInputRef: any = createRef()

	const themeMode = CMConstants.themeMode.light

	useEffect(() => {
		CMUIHelper.updateStatusBarStyle(themeMode)
		CMGlobal.navigation = navigation
		autoLogin()
	}, [])

	const autoLogin = () => {
		CMLocalStorageHelper.getUserCredentials((isSuccess: boolean, credentials: any) => {
			if (isSuccess) {
				login(credentials)
			}
		})
	}

	const login = (credentials: any) => {
		setLoading(true)
		CMFirebaseHelper.login(credentials.email, credentials.password, (response: {[name: string]: any}) => {
			setLoading(false)
			if (response.isSuccess) {
				CMLocalStorageHelper.setUserCredentials({email: credentials.email, password: credentials.password})
				navigation.replace('CMCoachStackNavigatorRoutes')
			} else {
				CMAlertDlgHelper.showAlertWithOK(response.value)
			}
		})
	}

	const onBtnLogin = () => {
		if (!CMUtils.isValidEmail(email)) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterValidEmail)
			return
		}

		if (password.length == 0) {
			CMAlertDlgHelper.showAlertWithOK('Please enter the password.')
			return
		}
		
		login({email: email, password: password})
	}

	const onBtnForgotPassword = () => {
		if (!CMUtils.isValidEmail(email)) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterValidEmail)
			return
		}

		setLoading(true)
		CMFirebaseHelper.forgotPassword(email, (response: {[name: string]: any}) => {
			setLoading(false)
			CMAlertDlgHelper.showAlertWithOK(response.value)
		})
	}

	const onBtnRegister = () => {
		navigation.navigate(CMConstants.screenName.register)
	}

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog
				visible={loading}
			/>
            <KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={CMCommonStyles.body}
			>
				<View>
					<View style={{flexDirection: 'row', marginVertical: CMConstants.space.large}}>
						<Text style={CMCommonStyles.title(themeMode)}>
							Login as coach
						</Text>
					</View>
					<View style={{flexDirection: 'row'}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Email
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						onChangeText={text => setEmail(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="next"
						onSubmitEditing={() =>
							passwordInputRef.current && passwordInputRef.current.focus()
						}
						underlineColorAndroid="#f000"
						blurOnSubmit={false}
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Password
						</Text>
					</View>
					<View style={{marginTop: 4}}>
						<TextInput
							style={CMCommonStyles.textInput(themeMode)}
							onChangeText={text => setPassword(text)}
							placeholder=""
							placeholderTextColor={CMConstants.color.grey}
							keyboardType="default"
							ref={passwordInputRef}
							onSubmitEditing={Keyboard.dismiss}
							blurOnSubmit={false}
							secureTextEntry={true}
							underlineColorAndroid="#f000"
							returnKeyType="done"
						/>
					</View>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonMain,
							{marginTop: CMConstants.space.small}
						]}
						onPress={onBtnLogin}
					>
						<Text style={CMCommonStyles.buttonMainText}>Login</Text>
					</CMRipple>
					<TouchableOpacity
						style={styles.forgotPassword}
						activeOpacity={0.5}
						onPress={onBtnForgotPassword}
					>
						<Text style={CMCommonStyles.textSmall(themeMode)}>
							Forgot Password?
						</Text>
					</TouchableOpacity>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonSecond,
							{marginTop: CMConstants.space.small}
						]}
						onPress={onBtnRegister}
					>
						<Text style={CMCommonStyles.buttonSecondText}>Register</Text>
					</CMRipple>
				</View>
            </KeyboardAwareScrollView>
		</SafeAreaView>
	)
}

const styles = {
	forgotPassword: {
		alignSelf: 'flex-end',
		marginTop: CMConstants.space.smallEx
	} as ViewStyle
}

export default CMLoginScreen
