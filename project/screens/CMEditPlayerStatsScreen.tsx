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
import { Timestamp } from '@react-native-firebase/firestore'
import CMFirebaseHelper from '../helper/CMFirebaseHelper'
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper'
import CMDropDownPicker from '../components/CMDropDownPicker'
import CMPermissionHelper from '../helper/CMPermissionHelper'

const CMEditPlayerStatsScreen = ({navigation, route}: CMNavigationProps) => {
	const [loading, setLoading] = useState(false)

	const [playerId, setPlayerId] = useState(route.params.playerStat.playerId ?? undefined)
	const [leagueId, setLeagueId] = useState(route.params.playerStat.leagueId ?? undefined)
	const [matchId, setMatchId] = useState(route.params.playerStat.matchId ?? undefined)
	const [dayTime, setDayTime] = useState(route.params.playerStat.dayTime ? route.params.playerStat.dayTime.toDate() : new Date())
	const [pointsPerGame, setPointsPerGame] = useState(`${route.params.playerStat.pointsPerGame ?? ''}`)
	const [assists, setAssists] = useState(`${route.params.playerStat.assists ?? ''}`)
	const [rebounds, setRebounds] = useState(`${route.params.playerStat.rebounds ?? ''}`)
	const [turnovers, setTurnovers] = useState(`${route.params.playerStat.turnovers ?? ''}`)
	const [steals, setSteals] = useState(`${route.params.playerStat.steals ?? ''}`)
	const [blocks, setBlocks] = useState(`${route.params.playerStat.blocks ?? ''}`)

	const isEdit = route.params.isEdit

	const [playerItems, setPlayerItems] = useState([])
	const [leagueItems, setLeagueItems] = useState([])
	const [matchItems, setMatchItems] = useState([])
	const [playerOpen, setPlayerOpen] = useState(false)
	const [leagueOpen, setLeagueOpen] = useState(false)
	const [matchOpen, setMatchOpen] = useState(false)
	const [showDatePicker, setShowDatePicker] = useState(false)

	const insets = useSafeAreaInsets()

	const themeMode = CMConstants.themeMode.light

	const onBtnSave = async () => {
		if (!playerId) {
			CMAlertDlgHelper.showAlertWithOK('Please select player.')
			return
		}
		if (!leagueId) {
			CMAlertDlgHelper.showAlertWithOK('Please select league.')
			return
		}
		if (!matchId) {
			CMAlertDlgHelper.showAlertWithOK('Please select match.')
			return
		}

		// Check permissions before saving (for editing, check if user can edit the match)
		if (isEdit && route.params.playerStat?.matchId) {
			const canEdit = await CMPermissionHelper.canEditMatch(route.params.playerStat.matchId);
			if (!canEdit) {
				CMPermissionHelper.showPermissionDenied(navigation);
				return;
			}
		} else if (!isEdit && matchId) {
			// For new stats, check if user can edit the selected match
			const canEdit = await CMPermissionHelper.canEditMatch(matchId);
			if (!canEdit) {
				CMPermissionHelper.showPermissionDenied(navigation);
				return;
			}
		}
		if (!CMUtils.isNumeric(parseFloat(pointsPerGame))) {
			CMAlertDlgHelper.showAlertWithOK('Points per game should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseFloat(assists))) {
			CMAlertDlgHelper.showAlertWithOK('Assists should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseFloat(rebounds))) {
			CMAlertDlgHelper.showAlertWithOK('Rebounds should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseFloat(turnovers))) {
			CMAlertDlgHelper.showAlertWithOK('Turnovers should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseFloat(steals))) {
			CMAlertDlgHelper.showAlertWithOK('Steals should be numeric.')
			return
		}
		if (!CMUtils.isNumeric(parseFloat(blocks))) {
			CMAlertDlgHelper.showAlertWithOK('Blocks should be numeric.')
			return
		}

		const data: {[name: string]: any} = {
			playerId: playerId,
			leagueId: leagueId,
			matchId: matchId,
			dayTime: Timestamp.fromDate(dayTime),
			pointsPerGame: parseFloat(pointsPerGame),
			assists: parseFloat(assists),
			rebounds: parseFloat(rebounds),
			turnovers: parseFloat(turnovers),
			steals: parseFloat(steals),
			blocks: parseFloat(blocks)
		}

		setLoading(true)
		if (isEdit) {
			CMFirebaseHelper.updatePlayerStat(route.params.playerStat.id, data, (response: {[name: string]: any}) => {
				setLoading(false)
				CMAlertDlgHelper.showAlertWithOK(response.value)
			})
		} else {
			const playerStatId = CMFirebaseHelper.getNewDocumentId(CMConstants.collectionName.playerStats)
			data['id'] = playerStatId
			CMFirebaseHelper.addPlayerStat(playerStatId, data, (response: {[name: string]: any}) => {
				setLoading(false)
				CMAlertDlgHelper.showAlertWithOK(response.value, () => {
					navigation.pop()
				})
			})
		}
	}

	useEffect(() => {
		navigation.setOptions({title: isEdit ? 'Edit Player Stats' : 'Add Player Stats'})

		setPlayerItems(route.params.players.map((player: {[name: string]: any}) => ({
			label: player.name,
			value: player.id
		})))

		CMFirebaseHelper.getLeagues((response: {[name: string]: any}) => {
			if (response.isSuccess) {
				setLeagueItems(response.value.map((league: {[name: string]: any}) => ({
					label: league.name,
					value: league.id
				})))
			}
		})
	}, [])

	useEffect(() => {
		if (!leagueId) {
			return
		}
		
		CMFirebaseHelper.getMatches(leagueId, (response: {[name: string]: any}) => {
			if (response.isSuccess) {
				setMatchItems(response.value.map((match: {[name: string]: any}) => ({
					label: match.name,
					value: match.id
				})))

				setMatchId(undefined)
			}
		})
	}, [leagueId])

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
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.normal,
						marginBottom: 4
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Player
						</Text>
					</View>
					<CMDropDownPicker
						isOpened={playerOpen}
						themeMode={themeMode}
						defaultStyle={CMCommonStyles.dropDownStyle}
						defaultDropDownContainerStyle={CMCommonStyles.dropDownContainerStyle}
						placeholder='Select Player'
						open={playerOpen}
						value={playerId ?? ''}
						items={playerItems}
						setOpen={setPlayerOpen}
						onSelectItem={(item: any)=>setPlayerId(item.value)}
						setItems={setPlayerItems}
						onOpen={() => {
							setLeagueOpen(false)
							setMatchOpen(false)
						}}
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx,
						marginBottom: 4
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							League
						</Text>
					</View>
					<CMDropDownPicker
						isOpened={leagueOpen}
						themeMode={themeMode}
						defaultStyle={CMCommonStyles.dropDownStyle}
						defaultDropDownContainerStyle={CMCommonStyles.dropDownContainerStyle}
						placeholder='Select League'
						open={leagueOpen}
						value={leagueId ?? ''}
						items={leagueItems}
						setOpen={setLeagueOpen}
						onSelectItem={(item: any)=>setLeagueId(item.value)}
						setItems={setLeagueItems}
						onOpen={() => {
							setPlayerOpen(false)
							setMatchOpen(false)
						}}
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx,
						marginBottom: 4
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Match
						</Text>
					</View>
					<CMDropDownPicker
						isOpened={matchOpen}
						themeMode={themeMode}
						defaultStyle={CMCommonStyles.dropDownStyle}
						defaultDropDownContainerStyle={CMCommonStyles.dropDownContainerStyle}
						placeholder='Select Match'
						open={matchOpen}
						value={matchId ?? ''}
						items={matchItems}
						setOpen={setMatchOpen}
						onSelectItem={(item: any)=>setMatchId(item.value)}
						setItems={setMatchItems}
						onOpen={() => {
							setPlayerOpen(false)
							setLeagueOpen(false)
						}}
					/>
					<View style={{
						flexDirection: 'row',
						marginTop: CMConstants.space.smallEx
					}}>
						<Text style={CMCommonStyles.label(themeMode)}>
							Date
						</Text>
					</View>
					<CMRipple
						containerStyle={[CMCommonStyles.textInput(themeMode), {flexDirection: 'row', alignItems: 'center', marginTop: 4}]}
						onPress={() => setShowDatePicker(true)}
					>
						<Text style={CMCommonStyles.textNormal(themeMode)}>
							{CMUtils.strDateOfBirthday(dayTime)}
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
							Points Per Game
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={pointsPerGame}
						onChangeText={text => setPointsPerGame(text)}
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
							Assists
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={assists}
						onChangeText={text => setAssists(text)}
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
							Rebounds
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={rebounds}
						onChangeText={text => setRebounds(text)}
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
							Turnovers
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={turnovers}
						onChangeText={text => setTurnovers(text)}
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
							Steals
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={steals}
						onChangeText={text => setSteals(text)}
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
							Blocks
						</Text>
					</View>
					<TextInput
						style={[CMCommonStyles.textInput(themeMode), {marginTop: 4}]}
						defaultValue={blocks}
						onChangeText={text => setBlocks(text)}
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
							<Text style={CMCommonStyles.buttonMainText}>{isEdit ? 'Save' : 'Add Player Stats'}</Text>
						</CMRipple>
					</View>
				</View>
			</KeyboardAwareScrollView>
			<DatePicker
				isVisible={showDatePicker}
				mode={'single'}
				minDate={new Date(CMConstants.string.minBirthDate)}
				initialDate={dayTime}
				onCancel={()=>setShowDatePicker(false)}
				onConfirm={(output)=>{
					setShowDatePicker(false)
					setDayTime(output.date!)
				}}
			/>
		</SafeAreaView>
	)
}

const styles = {

}

export default CMEditPlayerStatsScreen