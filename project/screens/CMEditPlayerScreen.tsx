import React, {useState, useEffect} from 'react'
import {View, SafeAreaView, Text, Keyboard} from 'react-native'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DatePicker from 'react-native-neat-date-picker'
import CMRipple from '../components/CMRipple'
import CMConstants from '../CMConstants'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import { TextInput } from 'react-native-gesture-handler'
import CMUtils from '../utils/CMUtils'
import CMImagePicker from '../helper/CMImagePicker'
import { Timestamp } from '@react-native-firebase/firestore'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMProgressiveImage from '../components/CMProgressiveImage'
import CMDropDownPicker from '../components/CMDropDownPicker'
import CMPermissionHelper from '../helper/CMPermissionHelper'

const CMEditPlayerScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [positionOpen, setPositionOpen] = useState(false)
	const [positionItems, setPositionItems] = useState([
		{label: CMConstants.playerPosition.pointGuard, value: CMConstants.playerPosition.pointGuard},
		{label: CMConstants.playerPosition.shootingGuard, value: CMConstants.playerPosition.shootingGuard},
		{label: CMConstants.playerPosition.smallForward, value: CMConstants.playerPosition.smallForward},
		{label: CMConstants.playerPosition.powerForward, value: CMConstants.playerPosition.powerForward},
		{label: CMConstants.playerPosition.center, value: CMConstants.playerPosition.center},
	])
	const isEdit = route.params.isEdit

	const [profileImagePath, setProfileImagePath] = useState(route.params.player.avatar ?? '')
	const [profileImageChanged, setProfileImageChanged] = useState(false)
	const [name, setName] = useState(route.params.player.name ?? '')
	const [birthDate, setBirthDate] = useState(route.params.player.birthDate ? route.params.player.birthDate.toDate() : undefined)
	const [jerseyNumber, setJerseyNumber] = useState(`${route.params.player.number ?? ''}`)
	const [position, setPosition] = useState(`${route.params.player.position ?? ''}`)
	const [height, setHeight] = useState(`${route.params.player.height ?? ''}`)
	const [weight, setWeight] = useState(`${route.params.player.weight ?? ''}`)
	const [showDatePicker, setShowDatePicker] = useState(false)

	const insets = useSafeAreaInsets()

	const themeMode = CMConstants.themeMode.light

	const onBtnProfileImage = () => {
		CMImagePicker.showImagePicker(1, (isSuccess: boolean, response: any) => {
			if (!isSuccess) {
				return
			}

			setProfileImageChanged(true)
			setProfileImagePath(response.path)
		})
	}

	const onBtnSave = () => {
		if (name.trim().length == 0) {
			CMAlertDlgHelper.showAlertWithOK('Please enter name.')
			return
		}
		if (!birthDate) {
			CMAlertDlgHelper.showAlertWithOK('Please enter birthdate.')
			return
		}
		if (!CMUtils.isNumeric(parseInt(jerseyNumber))) {
			CMAlertDlgHelper.showAlertWithOK('Jersey number should be numeric.')
			return
		}
		if (!position) {
			CMAlertDlgHelper.showAlertWithOK('Please select position.')
			return
		}
		if (!CMUtils.isNumeric(parseInt(height))) {
			CMAlertDlgHelper.showAlertWithOK('Height should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseInt(weight))) {
			CMAlertDlgHelper.showAlertWithOK('Weight should be numeric.')
			return
		}
		
		const data: {[name: string]: any} = {
			name: name,
			number: parseInt(jerseyNumber),
			position: position,
			height: parseInt(height),
			weight: parseInt(weight),
			birthDate: Timestamp.fromDate(birthDate)
		}

		const playerId = isEdit ? route.params.player.id : CMFirebaseHelper.getNewDocumentId(CMConstants.collectionName.players)

		const postUpdate = async () => {
			if (isEdit) {
				// Check permissions before updating
				const canEdit = await CMPermissionHelper.canEditPlayer(playerId, route.params.player);
				if (!canEdit) {
					setLoading(false);
					CMPermissionHelper.showPermissionDenied(navigation);
					return;
				}

				CMFirebaseHelper.updatePlayer(playerId, data, (response: {[name: string]: any}) => {
					setLoading(false)
					setProfileImageChanged(false)
					CMAlertDlgHelper.showAlertWithOK(response.value)
				})
			} else {
				data['id'] = playerId
				data['teamId'] = route.params.team.id
				CMFirebaseHelper.createPlayer(playerId, data, (response: {[name: string]: any}) => {
					setLoading(false)
					setProfileImageChanged(false)
					CMAlertDlgHelper.showAlertWithOK(response.value, () => {
						navigation.pop()
					})
				})
			}
		}

		setLoading(true)
		if (profileImageChanged) {
			CMFirebaseHelper.uploadImage(profileImagePath, `player_avatar/${playerId}.jpg`)
			.then(response => {
				if (response.isSuccess) {
					data['avatar'] = response.value
				}
				postUpdate()
			})
		} else {
			postUpdate()
		}
	}

	const onBtnDelete = async () => {
		// Check permissions before allowing delete
		const canEdit = await CMPermissionHelper.canEditPlayer(route.params.player.id, route.params.player);
		if (!canEdit) {
			CMPermissionHelper.showPermissionDenied(navigation);
			return;
		}

		CMAlertDlgHelper.showConfirmAlert(CMConstants.appName, `Are you sure you want to delete ${route.params.player.name}?`, (isYes: boolean) => {
			if (isYes) {
				setLoading(true)
				CMFirebaseHelper.updatePlayer(route.params.player.id, {deleted: true}, (response: {[name: string]: any}) => {
					setLoading(false)
					if (response.isSuccess) {
						navigation.pop()
					} else {
						CMAlertDlgHelper.showAlertWithOK('Failed to delete.')
					}
				})
			}
		})
	}

	useEffect(() => {
		navigation.setOptions({title: isEdit ? 'Edit Player' : 'Add New Player'})
		
		// Check permissions when editing
		if (isEdit && route.params.player?.id) {
			const checkPermissions = async () => {
				const canEdit = await CMPermissionHelper.canEditPlayer(route.params.player.id, route.params.player);
				if (!canEdit) {
					CMPermissionHelper.showPermissionDenied(navigation);
				}
			};
			checkPermissions();
		}
	}, [])

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog
				visible={loading}
			/>
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={CMCommonStyles.body}
			>
				<View style={{paddingBottom: insets.bottom}}>
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
							Player Name
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
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Jersey Number
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={jerseyNumber}
						onChangeText={text => setJerseyNumber(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						submitBehavior='submit'
						keyboardType="decimal-pad"
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx,
						marginBottom: 4
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Position
						</Text>
					</View>
					<CMDropDownPicker
						isOpened={positionOpen}
						themeMode={themeMode}
						defaultStyle={CMCommonStyles.dropDownStyle}
						defaultDropDownContainerStyle={CMCommonStyles.dropDownContainerStyle}
						placeholder='Select Position'
						open={positionOpen}
						value={position ?? ''}
						items={positionItems}
						setOpen={setPositionOpen}
						onSelectItem={(item: any)=>setPosition(item.value)}
						setItems={setPositionItems}
						onOpen={() => {}}
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Height - cm
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={height}
						onChangeText={text => setHeight(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						submitBehavior='submit'
						keyboardType="decimal-pad"
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Weight - kg
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={weight}
						onChangeText={text => setWeight(text)}
						placeholder=""
						placeholderTextColor={CMConstants.color.grey}
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="done"
						onSubmitEditing={Keyboard.dismiss}
						underlineColorAndroid="#f000"
						submitBehavior='submit'
						keyboardType="decimal-pad"
					/>
					<View style={{flexDirection: 'row', marginTop: CMConstants.space.normal}}>
						<CMRipple
							containerStyle={{...CMCommonStyles.buttonMain, flex: 1}}
							onPress={onBtnSave}
						>
							<Text style={CMCommonStyles.buttonMainText}>{isEdit ? 'Save' : 'Add Player'}</Text>
						</CMRipple>
						{isEdit && (
							<>
								<View style={{width: CMConstants.space.small}}/>
								<CMRipple
									containerStyle={{...CMCommonStyles.buttonSecond, borderColor: CMConstants.color.red, flex: 1}}
									onPress={onBtnDelete}
								>
									<Text style={{...CMCommonStyles.buttonSecondText, color: CMConstants.color.red}}>Delete</Text>
								</CMRipple>
							</>
						)}
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

export default CMEditPlayerScreen
