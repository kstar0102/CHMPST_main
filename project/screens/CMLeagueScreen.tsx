import React, {useState, useEffect} from 'react'
import {SafeAreaView, FlatList, View, Text} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMRipple from '../components/CMRipple'
import CMModal from '../dialog/CMModal'
import CMAddLeagueModalContent from '../dialog/CMAddLeagueModalContent'
import CMGlobal from '../CMGlobal'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMLeagueCell from '../components/CMLeagueCell'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMLoadingDialog from '../dialog/CMLoadingDialog'
import CMUtils from '../utils/CMUtils'

const CMLeagueScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)
	const [refreshing, setRefreshing] = useState(false)

	const [leagues, setLeagues] = useState([])
	const [showAddModal, setShowAddModal] = useState(false)
	const [isNoLeague, setIsNoLeague] = useState(false)

	const insets = useSafeAreaInsets()

	const themeMode = CMConstants.themeMode.light

	const loadLeagues = () => {
		setRefreshing(true)
		// Show loading dialog for initial load (not for refresh)
		if (!refreshing) {
			setLoading(true)
		}
		CMFirebaseHelper.getLeagues((response: {[name: string]: any}) => {
			setRefreshing(false)
			setLoading(false)
			if (response.isSuccess) {
				setIsNoLeague(response.value.length == 0)
				setLeagues(response.value)
			}
		})
	}

	useEffect(() => {
		navigation.addListener('focus', () => {
			loadLeagues()
		})

		return () => {
			navigation.removeListener('focus')
		}
	}, [])

	const onBtnAddLeague = () => {
		setShowAddModal(true)
	}

	const onEditLeague = (league: any) => {
		navigation.navigate(CMConstants.screenName.editLeague, {isEdit: true, league: league})
	}

	const onDeleteLeague = (league: any) => {
		CMAlertDlgHelper.showConfirmAlert(
			'Delete League',
			`Are you sure you want to delete "${league.name}"? This will permanently delete the league and ALL associated data. This action cannot be undone.`,
			(confirmed: boolean) => {
				if (confirmed) {
					setLoading(true)
					CMFirebaseHelper.deleteLeagueWithAssociatedData(league.id, (response: {[name: string]: any}) => {
						setLoading(false)
						CMAlertDlgHelper.showAlertWithOK(response.value)
						if (response.isSuccess) {
							loadLeagues()
						}
					})
				}
			}
		)
	}

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<CMLoadingDialog
				visible={loading}
			/>

			<View style={{flex: 1, marginHorizontal: CMConstants.space.normal}}>
				<View style={{height: CMConstants.height.navBar, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginTop: CMUtils.isAndroid ? insets.top : 0}}>
					<Text style={CMCommonStyles.title(themeMode)}>
						Leagues
					</Text>
					<CMRipple
						containerStyle={{...CMCommonStyles.circle(CMConstants.height.iconBig), position: 'absolute', justifyContent: 'center', alignItems: 'center', right: 0}}
						onPress={onBtnAddLeague}
					>
						<Ionicons
							name={"add-outline"}
							size={CMConstants.height.iconBig}
							color={CMConstants.color.black}
						/>
					</CMRipple>
				</View>

				<View style={{flex: 1}}>
					{isNoLeague ? (
						<>
							<View style={{flexDirection: 'row', marginVertical: CMConstants.space.large}}>
								<Text style={CMCommonStyles.title(themeMode)}>
									No league!
								</Text>
							</View>
							<View style={{
								flexDirection: 'row',
								marginTop: CMConstants.space.smallEx
							}}>
								<Text style={CMCommonStyles.label(themeMode)}>
									There is currently no league, create a league and become an admin of it or join an existing league with an invite code.
								</Text>
							</View>
							<CMRipple
								containerStyle={[
									CMCommonStyles.buttonMain,
									{marginTop: CMConstants.space.small}
								]}
								onPress={() => {setShowAddModal(true)}}
							>
								<Text style={CMCommonStyles.buttonMainText}>Start</Text>
							</CMRipple>
						</>
					) :(
						<FlatList
							style={{flex: 0, marginBottom: insets.bottom}}
							refreshing={refreshing}
							onRefresh={() => loadLeagues()}
							initialNumToRender={leagues.length}
							data={leagues}
							renderItem={({ item, separators }) => (
								<CMLeagueCell
									league={item}
									onPress={() => {
										navigation.navigate(CMConstants.screenName.leagueDetails, {league: item})
									}}
									onEdit={onEditLeague}
									onDelete={onDeleteLeague}
								/>
							)}
							ItemSeparatorComponent={({ highlighted }) => (
								<View style={{height: CMConstants.space.smallEx}} />
							)}
						/>
					)}
				</View>
			</View>

			<CMModal
				isVisible={showAddModal}
				content={
					<CMAddLeagueModalContent
						callback={(action: number, code: string) => {
							setShowAddModal(false)
							if (action == 0) {
								return
							}
							// if (!CMGlobal.user.teamId) {
							// 	CMAlertDlgHelper.showAlertWithOK('Create your team first.')
							// 	return
							// }
							if (action == 1) {// join league
								setLoading(true)
								CMFirebaseHelper.joinLeagues(code, CMGlobal.user.teamId, (response: {[name: string]: any}) => {
									setLoading(false)
									CMAlertDlgHelper.showAlertWithOK(response.value)
									if (response.isSuccess) {
										loadLeagues()
									}
								})
							} else if (action == 2) {// create league
								navigation.navigate(CMConstants.screenName.editLeague, {isEdit: false})
							}
						}}
					/>
				}
			/>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMLeagueScreen