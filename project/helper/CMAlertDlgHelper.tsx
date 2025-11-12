import {Alert} from 'react-native'
import CMConstants from '../CMConstants'

export default {
	showAlertWithOK: (message: string, callback?: Function) => {
		Alert.alert(CMConstants.appName, message, [
			{
				text: CMConstants.string.ok,
				onPress: () => {
					callback && callback()
				}
			}
		])
	},

	showConfirmAlert: (title: string, message: string, callback: Function, yesTitle?: string, noTitle?: string) => {
		Alert.alert(title, message, [
			{
				text: noTitle ?? CMConstants.string.cancel,
				onPress: () => {
					callback(false)
				}
			},
			{
				text: yesTitle ?? CMConstants.string.yes,
				onPress: () => {
					callback(true)
				}
			}
		])
	}
}