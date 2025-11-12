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
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMUserRole from '../model/CMUserRole'
import CMLocalStorageHelper from '../helper/CMLocalStorageHelper'

const CMRegisterScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [passwordConfirm, setPasswordConfirm] = useState('')
	const [name, setName] = useState('')

	const passwordInputRef: any = createRef()
	const passwordConfirmInputRef: any = createRef()
	const nameInputRef: any = createRef()

	const themeMode = CMConstants.themeMode.light

	const onBtnRegister = () => {
		if (!CMUtils.isValidEmail(email)) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterValidEmail)
			return
		}

		if (password.length < 6) {
			CMAlertDlgHelper.showAlertWithOK('Password must be at least 6 characters long.')
			return
		}

		if (password != passwordConfirm) {
			CMAlertDlgHelper.showAlertWithOK("Passwords don't match.")
			return
		}

		if (name.trim().length == 0) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterYourName)
			return
		}

		setLoading(true)
		CMFirebaseHelper.register(email, password, (response: {[name: string]: any}) => {
			if (response.isSuccess) {
				CMFirebaseHelper.setUser({
					id: response.value.uid,
					email: email,
					name: name.trim(),
					role: CMUserRole.coach 
				}, (response: {[name: string]: any}) => {
					setLoading(false)
					if (response.isSuccess) {
						CMLocalStorageHelper.setUserCredentials({email: email, password: password})
						navigation.replace('CMCoachStackNavigatorRoutes')
					} else {
						CMAlertDlgHelper.showAlertWithOK(response.value)
					}
				})
			} else {
				setLoading(false)
				CMAlertDlgHelper.showAlertWithOK(response.value)
			}
		})
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
							Register as coach
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
							ref={passwordInputRef}
							style={CMCommonStyles.textInput(themeMode)}
							onChangeText={text => setPassword(text)}
							placeholder=""
							placeholderTextColor={CMConstants.color.grey}
							keyboardType="default"
							returnKeyType="next"
							onSubmitEditing={() =>
								passwordConfirmInputRef.current && passwordConfirmInputRef.current.focus()
							}
							blurOnSubmit={false}
							secureTextEntry={true}
							underlineColorAndroid="#f000"
						/>
					</View>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Confirm Password
						</Text>
					</View>
					<View style={{marginTop: 4}}>
						<TextInput
							ref={passwordConfirmInputRef}
							style={CMCommonStyles.textInput(themeMode)}
							onChangeText={text => setPasswordConfirm(text)}
							placeholder=""
							placeholderTextColor={CMConstants.color.grey}
							keyboardType="default"
							returnKeyType="next"
							onSubmitEditing={() =>
								nameInputRef.current && nameInputRef.current.focus()
							}
							blurOnSubmit={false}
							secureTextEntry={true}
							underlineColorAndroid="#f000"
						/>
					</View>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Name
						</Text>
					</View>
					<TextInput
						ref={nameInputRef}
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						onChangeText={text => setName(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						blurOnSubmit={false}
					/>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonMain,
							{marginTop: CMConstants.space.small}
						]}
						onPress={onBtnRegister}
					>
						<Text style={CMCommonStyles.buttonMainText}>Register</Text>
					</CMRipple>
				</View>
            </KeyboardAwareScrollView>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMRegisterScreen
