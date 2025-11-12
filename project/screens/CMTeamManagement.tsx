import React, {useState, useEffect, useRef} from 'react'
import {SafeAreaView, TextStyle, View, Image, Dimensions, Text} from 'react-native'
import { getAuth } from '@react-native-firebase/auth'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import ActionSheet from 'react-native-actionsheet'
import {useToast} from 'react-native-toast-notifications'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils'
import CMRipple from '../components/CMRipple'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMToast from '../components/CMToast'
import CMProfileImage from '../components/CMProfileImage'
import CMGlobal from '../CMGlobal'
import CMUserRole from '../model/CMUserRole'

const CMTeamManagementScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [team, setTeam] = useState<{[name: string]: any}>()
	const [players, setPlayers] = useState<{[name: string]: any}[]>([])
	const insets = useSafeAreaInsets()

	const toast = useToast()
	const actionCreateRef = useRef<any>(null)

	const themeMode = CMConstants.themeMode.light

	const courtWidth = Dimensions.get('window').width - CMConstants.space.normal * 2
	const courtHeight = courtWidth * 1.65

	const addBtnWidth = 40
	
	const onBtnMore = () => {
		actionCreateRef.current.show()
	}

	const AddPlayerButton = (props: any) => {
		const { style = {}, position = '' } = props

		const player = players.find(player => player.position == position) ?? {}

		return (
			<View style={{...style, width: addBtnWidth, position: 'absolute', justifyContent: 'center', alignItems: 'center'}}>
				<CMRipple
					containerStyle={{...CMCommonStyles.circle(addBtnWidth), justifyContent: 'center', alignItems: 'center', backgroundColor: CMConstants.color.lightGrey}}
					onPress={() => {
						if (player.id) {
							navigation.navigate(CMConstants.screenName.playerDetails, {player: player})
						} else {
							navigation.navigate(CMConstants.screenName.editPlayer, {isEdit: false, team: team, player: {position: position}})
						}
					}}
				>
					{player.avatar ? (
						<CMProfileImage
							radius={addBtnWidth}
							imgURL={player.avatar}
							isUser={true}
						/>
					) : (
						<Ionicons
							name={"add-outline"}
							size={CMConstants.height.iconBig}
							color={CMConstants.color.black}
						/>
					)}
				</CMRipple>
				<Text style={{...CMCommonStyles.textSmall(themeMode), width: 80, textAlign: 'center'}}>
					{player.name ?? ''}
				</Text>
			</View>
		)
	}

	useEffect(() => {
		// Use team from props if available, otherwise fall back to current user's team
		const teamData = route.params?.team
		
		if (teamData) {
			// Use team data passed through props
			setTeam(teamData)
			// Set navigation title to team name
			navigation.setOptions({ title: teamData.name || 'Team Management' })
			CMFirebaseHelper.getPlayers([teamData.id], (response: {[name: string]: any}) => {
				if (response.isSuccess) {
					setPlayers(response.value)
				} else {
					CMToast.makeText(toast, response.value)
				}
			})
		} else {
			// Fall back to current user's team if no team data provided
			CMFirebaseHelper.getTeam(getAuth().currentUser!.uid, (response: {[name: string]: any}) => {
				if (response.isSuccess) {
					setTeam(response.value)
					// Set navigation title to team name
					navigation.setOptions({ title: response.value.name || 'Team Management' })
					CMFirebaseHelper.getPlayers([response.value.id], (response: {[name: string]: any}) => {
						if (response.isSuccess) {
							setPlayers(response.value)
						} else {
							CMToast.makeText(toast, response.value)
						}
					})
				} else {
					CMToast.makeText(toast, response.value)
				}
			})
		}
	}, [route.params?.team])

	useEffect(() => {
		navigation.addListener('focus', () => {
			// Reload players when screen comes into focus
			if (team) {
				CMFirebaseHelper.getPlayers([team.id], (response: {[name: string]: any}) => {
					if (response.isSuccess) {
						setPlayers(response.value)
					} else {
						CMToast.makeText(toast, response.value)
					}
				})
			}
		})

		return () => {
			navigation.removeListener('focus')
		}
	}, [team])

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog
				visible={loading}
			/>
			<View style={{...CMCommonStyles.body, flex: 1}}>
				{/* <View style={{backgroundColor: CMUtils.colorWithWhiteBlack(themeMode), height: CMConstants.height.navBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: CMUtils.isAndroid ? insets.top : 0, zIndex: 10}}>
					<Text style={CMCommonStyles.title(themeMode)}>
						{ "Team Management"}
					</Text>
					<CMRipple
						containerStyle={{...CMCommonStyles.circle(CMConstants.height.iconBig), position: 'absolute', justifyContent: 'center', alignItems: 'center', right: 0}}
						onPress={onBtnMore}
					>
						<Ionicons
							name={"ellipsis-horizontal"}
							size={CMConstants.height.icon}
							color={CMConstants.color.black}
						/>
					</CMRipple>
				</View> */}
				<View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
					<View style={{width: courtWidth, height: courtHeight}}>
						<Image
							style={{width: '100%', height: '100%'}}
							source={require('../../assets/images/img_court.png')}
							resizeMode='stretch'
						/>
						<AddPlayerButton
							style={{left: courtWidth * 0.25 - addBtnWidth * 0.5, top: courtHeight * 0.28 - addBtnWidth * 0.5}}
							position={CMConstants.playerPosition.pointGuard}
						/>
						<AddPlayerButton
							style={{left: courtWidth * 0.75 - addBtnWidth * 0.5, top: courtHeight * 0.28 - addBtnWidth * 0.5}}
							position={CMConstants.playerPosition.shootingGuard}
						/>
						<AddPlayerButton
							style={{left: courtWidth * 0.25 - addBtnWidth * 0.5, top: courtHeight * 0.54 - addBtnWidth * 0.5}}
							position={CMConstants.playerPosition.smallForward}
						/>
						<AddPlayerButton
							style={{left: courtWidth * 0.75 - addBtnWidth * 0.5, top: courtHeight * 0.54 - addBtnWidth * 0.5}}
							position={CMConstants.playerPosition.powerForward}
						/>
						<AddPlayerButton
							style={{left: courtWidth * 0.5 - addBtnWidth * 0.5, top: courtHeight * 0.7 - addBtnWidth * 0.5}}
							position={CMConstants.playerPosition.center}
						/>
					</View>
				</View>
			</View>
			<ActionSheet
				ref={actionCreateRef}
				title={''}
				options={['Edit Team', 'Edit Players', 'Add Player Stats', 'Cancel']}
				cancelButtonIndex={3}
				destructiveButtonIndex={3}
				onPress={(index: number) => {
					if (index === 0) {
						if (team) {
							navigation.navigate(CMConstants.screenName.editTeam, {team: team})
						}
					} else if (index === 1) {
						navigation.navigate(CMConstants.screenName.playersOfTeam, {team: team, players: players})
					} else if (index === 2) {
						navigation.navigate(CMConstants.screenName.editPlayerStats, {playerStat: {}, team: team, players: players})
					}
				}}
			/>
		</SafeAreaView>
	)
}

const styles = {
	title: (themeMode: string) => ({
		...CMCommonStyles.textLargeExBold(CMConstants.themeMode.light),
		color: CMUtils.colorWith(themeMode, CMConstants.color.black, CMConstants.color.white),
		alignSelf: 'center',
		bottom: '10%',
		marginHorizontal: '15%'
	} as TextStyle)
}

export default CMTeamManagementScreen