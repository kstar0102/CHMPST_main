import React, {useState, useEffect} from 'react'
import { Text, StyleSheet, View, TextInput, Keyboard } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CMConstants from '../CMConstants'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMRipple from '../components/CMRipple'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'

const CMAddLeagueModalContent = (props: any) => {
	const [code, setCode] = useState('')

	const themeMode = CMConstants.themeMode.light

	const insets = useSafeAreaInsets()
	

	useEffect(() => {
	}, [])

	return (
		<View style={{...CMCommonStyles.bodyMain(themeMode), marginHorizontal: CMConstants.space.large, overflow: 'hidden', backgroundColor: 'transparent', borderRadius: CMConstants.radius.normal}}>
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled">
				<View style={{...CMCommonStyles.addModalContentViewStyle(themeMode), marginTop: insets.top}}>
					<Text style={{...CMCommonStyles.title(themeMode), marginTop: CMConstants.space.small}}>
						Enter code to join
					</Text>
					<Text style={{...CMCommonStyles.label(themeMode), marginTop: CMConstants.space.small}}>
						Code
					</Text>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						onChangeText={text => setCode(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						submitBehavior='submit'
					/>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonMain,
							{marginTop: CMConstants.space.small}
						]}
						onPress={() => {
							if (code.trim().length == 0) {
								CMAlertDlgHelper.showAlertWithOK('Please enter the code.')
								return
							}
							props.callback(1, code)
						}}
					>
						<Text style={CMCommonStyles.buttonMainText}>Join</Text>
					</CMRipple>
					<Text style={{...CMCommonStyles.label(themeMode), alignSelf: 'center', marginTop: CMConstants.space.smallEx}}>
						or
					</Text>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonSecond,
							{marginTop: CMConstants.space.smallEx}
						]}
						onPress={() => {
							props.callback(2)
						}}
					>
						<Text style={CMCommonStyles.buttonSecondText}>Create League</Text>
					</CMRipple>
					<CMRipple
						containerStyle={[
							CMCommonStyles.buttonSecond,
							{marginTop: CMConstants.space.smallEx}
						]}
						onPress={() => {
							props.callback(0)
						}}
					>
						<Text style={CMCommonStyles.buttonSecondText}>Cancel</Text>
					</CMRipple>
				</View>
			</KeyboardAwareScrollView>
		</View>
	)
}

export default CMAddLeagueModalContent

const styles = StyleSheet.create({

})