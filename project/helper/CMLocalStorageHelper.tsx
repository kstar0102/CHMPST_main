import AsyncStorage from '@react-native-async-storage/async-storage'

export default {
	setUserCredentials: (userData: {[name: string]: any}) => {
		AsyncStorage.setItem('credentials', JSON.stringify(userData))
	},
	getUserCredentials: (callback: Function) => {
		AsyncStorage.getItem('credentials').then(credentials => {
			if (credentials !== null) {
				callback(true, JSON.parse(credentials))
			} else {
				callback(false)
			}
		})
	},
	removeUserCredentials: (callback?: Function) => {
		AsyncStorage.removeItem('credentials').then(error => {
			callback && callback(true)
		})
	}
}
