import React, {useState, useEffect, createRef} from 'react'
import {SafeAreaView, TextStyle, ScrollView, Text, View} from 'react-native'
import { getAuth, signOut } from '@react-native-firebase/auth'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils'
import CMRipple from '../components/CMRipple'
import CMLocalStorageHelper from '../helper/CMLocalStorageHelper'
import CMGlobal from '../CMGlobal'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMLoadingDialog from '../dialog/CMLoadingDialog'

const CMSettingsScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const insets = useSafeAreaInsets()

	const themeMode = CMConstants.themeMode.light

	const onBtnChangePassword = () => {
		navigation.navigate(CMConstants.screenName.changePwd)
	}

	const onBtnEditProfile = () => {
		setLoading(true)
		CMFirebaseHelper.getUser(getAuth().currentUser!.uid, (response: {[name: string]: any}) => {
			setLoading(false)
			if (response.isSuccess) {
				navigation.navigate(CMConstants.screenName.editProfile, {user: response.value})
			} else {
				CMAlertDlgHelper.showAlertWithOK(response.value)
			}
		})
	}

	const onBtnTeamProfile = () => {
		setLoading(true)
		CMFirebaseHelper.getTeam(getAuth().currentUser!.uid, (response: {[name: string]: any}) => {
			setLoading(false)
			if (response.isSuccess) {
				navigation.navigate(CMConstants.screenName.editTeam, {team: response.value})
			} else {
				CMAlertDlgHelper.showAlertWithOK(response.value)
			}
		})
	}

	const onBtnLogout = () => {
		CMAlertDlgHelper.showConfirmAlert(CMConstants.appName, 'Are you sure you want to logout?', (isYes: boolean) => {
			if (isYes) {
				signOut(getAuth()).then(() => {
					CMLocalStorageHelper.removeUserCredentials((error: Error) => {
						CMGlobal.navigation.replace('Auth')
					})
				})
			}
		})
	}

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog
				visible={loading}
			/>
			
			<View style={{height: CMConstants.height.navBar, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginTop: CMUtils.isAndroid ? insets.top : 0}}>
				<Text style={CMCommonStyles.title(themeMode)}>
					Settings
				</Text>
			</View>

			<ScrollView
				style={{flex: 1, marginHorizontal: CMConstants.space.normal}}
				nestedScrollEnabled={true}
			>
				<CMRipple
					containerStyle={styles.cell}
					onPress={onBtnEditProfile}
					color={CMUtils.colorWithBlackWhite(themeMode)}
				>
					<Ionicons
						name={"person-outline"}
						size={CMConstants.height.iconBig}
						color={CMConstants.color.black}
					/>
					<Text style={styles.label(themeMode)}>
						Edit Profile
					</Text>
				</CMRipple>
				<CMRipple
					containerStyle={styles.cell}
					onPress={onBtnTeamProfile}
					color={CMUtils.colorWithBlackWhite(themeMode)}
				>
					<Ionicons
						name={"people-outline"}
						size={CMConstants.height.iconBig}
						color={CMConstants.color.black}
					/>
					<Text style={styles.label(themeMode)}>
						Team Profile
					</Text>
				</CMRipple>
				<CMRipple
					containerStyle={styles.cell}
					onPress={onBtnChangePassword}
					color={CMUtils.colorWithBlackWhite(themeMode)}
				>
					<Ionicons
						name={"key-outline"}
						size={CMConstants.height.iconBig}
						color={CMConstants.color.black}
					/>
					<Text style={styles.label(themeMode)}>
						Change Password
					</Text>
				</CMRipple>
				<CMRipple
					containerStyle={styles.cell}
					onPress={onBtnLogout}
					color={CMUtils.colorWithBlackWhite(themeMode)}
				>
					<Ionicons
						name={"log-out-outline"}
						size={CMConstants.height.iconBig}
						color={CMConstants.color.red}
					/>
					<Text style={{...styles.label(themeMode), color: CMConstants.color.red}}>
						Logout
					</Text>
				</CMRipple>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = {
	label: (themeMode: string) => ({
		...CMCommonStyles.label(themeMode),
		marginLeft: CMConstants.space.smallEx
	}),
	cell: {
		height: 50,
		...CMCommonStyles.flexRowCenter
	},
	title: (themeMode: string) => ({
		...CMCommonStyles.textNormal(themeMode),
		marginHorizontal: CMConstants.space.smallEx
	} as TextStyle),
}

export default CMSettingsScreen