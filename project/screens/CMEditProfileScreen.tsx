import React, {useState} from 'react'
import {View, SafeAreaView, Text, Keyboard} from 'react-native'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicons from 'react-native-vector-icons/Ionicons'
import DatePicker from 'react-native-neat-date-picker'
import CMRipple from '../components/CMRipple'
import CMConstants from '../CMConstants'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import { TextInput } from 'react-native-gesture-handler'
import CMGlobal from '../CMGlobal'
import CMUtils from '../utils/CMUtils'
import CMImagePicker from '../helper/CMImagePicker'
import { getAuth } from '@react-native-firebase/auth'
import { Timestamp } from '@react-native-firebase/firestore'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMLocalStorageHelper from '../helper/CMLocalStorageHelper'
import CMProgressiveImage from '../components/CMProgressiveImage'

const CMEditProfileScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)

	const [profileImagePath, setProfileImagePath] = useState(route.params.user.avatar ?? '')
	const [profileImageChanged, setProfileImageChanged] = useState(false)
	const [name, setName] = useState(route.params.user.name ?? '')
	const [email, setEmail] = useState(route.params.user.email ?? '')
	const [birthDate, setBirthDate] = useState(route.params.user.birthDate ? route.params.user.birthDate.toDate() : undefined)
	const [showDatePicker, setShowDatePicker] = useState(false)

	const themeMode = CMConstants.themeMode.light

	const onBtnProfileImage = () => {
		CMImagePicker.showImagePicker(1, (isSuccess: boolean, response: any) => {
			if (!isSuccess) {
				return
			}

			const fileName = `${getAuth().currentUser?.uid}.jpg`
			const formData = new FormData()

			setProfileImageChanged(true)
			setProfileImagePath(response.path)
		})
	}

	const onBtnDeleteAccount = () => {
		CMAlertDlgHelper.showConfirmAlert(CMConstants.appName, 'You can not recover your account later. Are you sure you want to delete account?', (isYes: boolean) => {
			if (isYes) {
				setLoading(true)
				CMFirebaseHelper.deleteUser((response: {[name: string]: any}) => {
					setLoading(false)
					if (response.isSuccess) {
						CMLocalStorageHelper.removeUserCredentials((error: Error) => {
							CMGlobal.navigation.replace('Auth')
						})
					} else {
						CMAlertDlgHelper.showAlertWithOK(response.value)
					}
				})
			}
		})
	}

	const onBtnUpdateAccount = () => {
		if (name.trim().length == 0) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterYourName)
			return
		}
		if (!CMUtils.isValidEmail(email)) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterValidEmail)
			return
		}
	
		const updatedUser: {[name: string]: any} = {name: name, email: email, birthDate: Timestamp.fromDate(birthDate)}
		const postUpdateUser = () => {
			CMFirebaseHelper.updateUser(getAuth().currentUser!.uid, updatedUser, (response: {[name: string]: any}) => {
				setLoading(false)
				setProfileImageChanged(false)
				CMAlertDlgHelper.showAlertWithOK(response.value)
			})
		}

		const postUploadImage = () => {
			if (getAuth().currentUser!.email != email) {
				CMFirebaseHelper.updateUserEmail(email, (response: {[name: string]: any}) => {
					if (response.isSuccess) {
						CMLocalStorageHelper.getUserCredentials((isSuccess: boolean, credentials: any) => {
							if (isSuccess) {
								credentials['email'] = email
								CMLocalStorageHelper.setUserCredentials(credentials)
							}
						})
						postUpdateUser()
					} else {
						setLoading(false)
						CMAlertDlgHelper.showAlertWithOK('Failed to update.')
					}
				})
			} else {
				postUpdateUser()
			}
		}

		setLoading(true)
		if (profileImageChanged) {
			CMFirebaseHelper.uploadImage(profileImagePath, `user_avatar/${route.params.user.id}.jpg`)
			.then(response => {
				if (response.isSuccess) {
					updatedUser['avatar'] = response.value
				}
				postUploadImage()
			})
		} else {
			postUploadImage()
		}
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
					<View style={{width: 180, height: 180, alignSelf: 'center', marginVertical: CMConstants.space.normal}}>
						<CMRipple
							containerStyle={CMCommonStyles.profileImageContainer(180)}
							onPress={onBtnProfileImage}
						>
							<CMProgressiveImage
								style={CMCommonStyles.profileImage}
								imgURL={profileImagePath}
								isUser={true}
							/>
						</CMRipple>
						<CMRipple
							containerStyle={{...CMCommonStyles.circle(CMConstants.height.icon + 8), backgroundColor: CMConstants.color.lightGrey, position: 'absolute', justifyContent: 'center', alignItems: 'center', bottom: 12, right: 12}}
							onPress={onBtnProfileImage}
						>
							<Ionicons
								name={"ellipsis-horizontal"}
								size={CMConstants.height.icon}
								color={CMConstants.color.black}
							/>
						</CMRipple>
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
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={name}
						onChangeText={text => setName(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						submitBehavior='submit'
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Date of birth
						</Text>
					</View>
					<CMRipple
						containerStyle={[CMCommonStyles.textInput(themeMode), {flexDirection: 'row', alignItems: 'center', marginTop: 4}]}
						onPress={() => setShowDatePicker(true)}
					>
						<Text style={CMCommonStyles.textNormal(themeMode)}>
							{birthDate ? CMUtils.strDateOfBirthday(birthDate) : ''}
						</Text>
						<View style={{flex: 1}}/>
						<Ionicons
							name={"calendar-outline"}
							size={CMConstants.height.icon}
							color={CMConstants.color.black}
						/>
					</CMRipple>
					<View style={{flexDirection: 'row', marginTop: CMConstants.space.smallEx}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Email
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={email}
						onChangeText={text => setEmail(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						blurOnSubmit={false}
					/>
					<View style={{flexDirection: 'row', marginTop: CMConstants.space.normal}}>
						<CMRipple
							containerStyle={{...CMCommonStyles.buttonMain, flex: 1}}
							onPress={onBtnUpdateAccount}
						>
							<Text style={CMCommonStyles.buttonMainText}>Update</Text>
						</CMRipple>
						<View style={{width: CMConstants.space.small}}/>
						<CMRipple
							containerStyle={{...CMCommonStyles.buttonSecond, borderColor: CMConstants.color.red, flex: 1}}
							onPress={onBtnDeleteAccount}
						>
							<Text style={{...CMCommonStyles.buttonSecondText, color: CMConstants.color.red}}>Delete Account</Text>
						</CMRipple>
					</View>
				</View>
			</KeyboardAwareScrollView>
			<DatePicker
				isVisible={showDatePicker}
				mode={'single'}
				minDate={new Date(CMConstants.string.minBirthDate)}
				initialDate={birthDate ? birthDate : new Date(CMConstants.string.initialBirthDate)}
				onCancel={()=>setShowDatePicker(false)}
				onConfirm={(output)=>{
					setShowDatePicker(false)
					setBirthDate(output.date!)
				}}
			/>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMEditProfileScreen
