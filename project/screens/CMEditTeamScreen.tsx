import React, {useState, useEffect} from 'react'
import {View, SafeAreaView, Text, Keyboard} from 'react-native'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMRipple from '../components/CMRipple'
import CMConstants from '../CMConstants'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import { TextInput } from 'react-native-gesture-handler'
import CMImagePicker from '../helper/CMImagePicker'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMProgressiveImage from '../components/CMProgressiveImage'
import { getAuth } from '@react-native-firebase/auth'
import CMGlobal from '../CMGlobal'

const CMEditTeamScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)

	const isEdit = route.params?.isEdit ?? true;
	const team = route.params?.team ?? {};
	const league = route.params?.league ?? null;

	const [profileImagePath, setProfileImagePath] = useState(team.avatar ?? '')
	const [profileImageChanged, setProfileImageChanged] = useState(false)
	const [name, setName] = useState(team.name ?? '')

	const themeMode = CMConstants.themeMode.light

	useEffect(() => {
		navigation.setOptions({ 
			title: isEdit ? 'Edit Team' : 'Add Team' 
		});
	}, [isEdit]);

	const onBtnProfileImage = () => {
		CMImagePicker.showImagePicker(1, (isSuccess: boolean, response: any) => {
			if (!isSuccess) {
				return
			}

			setProfileImageChanged(true)
			setProfileImagePath(response.path)
		})
	}

	const onBtnUpdateTeam = () => {
		if (name.trim().length == 0) {
			CMAlertDlgHelper.showAlertWithOK(CMConstants.string.enterTeamName)
			return
		}
	
		const teamId = isEdit ? team.id : CMFirebaseHelper.getNewDocumentId(CMConstants.collectionName.teams);
		const updatedTeam: {[name: string]: any} = {
			id: teamId,
			name: name,
			coachId: getAuth().currentUser?.uid
		}

		const postUpdateTeam = () => {
			if (isEdit) {
				CMFirebaseHelper.updateTeam(teamId, updatedTeam, (response: {[name: string]: any}) => {
					setLoading(false)
					setProfileImageChanged(false)
					CMAlertDlgHelper.showAlertWithOK(response.value)
				})
			} else {
				CMFirebaseHelper.setTeam(teamId, updatedTeam, (response: {[name: string]: any}) => {
					if (response.isSuccess && league) {
						// Add team to league
						CMFirebaseHelper.addTeamToLeague(league.id, teamId, (leagueResponse: {[name: string]: any}) => {
							setLoading(false)
							setProfileImageChanged(false)
							if (leagueResponse.isSuccess) {
								CMAlertDlgHelper.showAlertWithOK('Team created and added to league successfully!', () => {
									navigation.pop();
								});
							} else {
								CMAlertDlgHelper.showAlertWithOK('Team created but failed to add to league: ' + leagueResponse.value);
							}
						});
					} else {
						setLoading(false)
						setProfileImageChanged(false)
						if (response.isSuccess) {
							CMAlertDlgHelper.showAlertWithOK('Team created successfully!', () => {
								navigation.pop();
							});
						} else {
							CMAlertDlgHelper.showAlertWithOK('Failed to create team: ' + response.value);
						}
					}
				})
			}
		}

		setLoading(true)
		if (profileImageChanged) {
			CMFirebaseHelper.uploadImage(profileImagePath, `team_avatar/${teamId}.jpg`)
			.then(response => {
				if (response.isSuccess) {
					updatedTeam['avatar'] = response.value
				}
				postUpdateTeam()
			})
		} else {
			postUpdateTeam()
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
					<View style={{flexDirection: 'row', marginTop: CMConstants.space.normal}}>
						<CMRipple
							containerStyle={{...CMCommonStyles.buttonMain, flex: 1}}
							onPress={onBtnUpdateTeam}
						>
							<Text style={CMCommonStyles.buttonMainText}>{isEdit ? 'Update' : 'Create'}</Text>
						</CMRipple>
					</View>
				</View>
			</KeyboardAwareScrollView>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMEditTeamScreen
