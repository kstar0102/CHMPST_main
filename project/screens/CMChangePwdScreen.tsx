import React, {useState, createRef} from 'react'
import {View, SafeAreaView, Text, Keyboard} from 'react-native'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import CMRipple from '../components/CMRipple'
import CMConstants from '../CMConstants'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import { TextInput } from 'react-native-gesture-handler'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMLocalStorageHelper from '../helper/CMLocalStorageHelper'
import CMGlobal from '../CMGlobal'

const CMChangePwdScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [curPassword, setCurPassword] = useState('')
	const [password, setPassword] = useState('')
	const [passwordConfirm, setPasswordConfirm] = useState('')

	const passwordInputRef: any = createRef()
	const passwordConfirmInputRef: any = createRef()

	const themeMode = CMConstants.themeMode.light

	const onBtnUpdate = () => {
		if (curPassword.length < 6) {
			CMAlertDlgHelper.showAlertWithOK('Password must be at least 6 characters long.')
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

		CMLocalStorageHelper.getUserCredentials((isSuccess: boolean, credentials: any) => {
			if (isSuccess) {
				if (curPassword != credentials.password) {
					CMAlertDlgHelper.showAlertWithOK('Current password is incorrect.')
					return
				}

				setLoading(true)
				CMFirebaseHelper.updateUserPassword(password, (response: {[name: string]: any}) => {
					setLoading(false)
					if (response.isSuccess) {
						credentials['password'] = password
						CMLocalStorageHelper.setUserCredentials(credentials)
						CMAlertDlgHelper.showAlertWithOK(response.value, () => {
							navigation.pop()
						})
					} else {
						CMAlertDlgHelper.showAlertWithOK(response.value)
					}
				})
			} else {
				CMAlertDlgHelper.showAlertWithOK('Failed to change password.')
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
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.large
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Current Password
						</Text>
					</View>
					<View style={{marginTop: 4}}>
						<TextInput
							style={CMCommonStyles.textInput(themeMode)}
							onChangeText={text => setCurPassword(text)}
							placeholder=""
							placeholderTextColor={CMConstants.color.grey}
							keyboardType="default"
							returnKeyType="next"
							onSubmitEditing={() =>
								passwordInputRef.current && passwordInputRef.current.focus()
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
							returnKeyType="done"
							onSubmitEditing={Keyboard.dismiss}
							blurOnSubmit={false}
							secureTextEntry={true}
							underlineColorAndroid="#f000"
						/>
					</View>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonMain,
							{marginTop: CMConstants.space.small}
						]}
						onPress={onBtnUpdate}
					>
						<Text style={CMCommonStyles.buttonMainText}>Update</Text>
					</CMRipple>
				</View>
			</KeyboardAwareScrollView>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMChangePwdScreen
