import { Spinner } from '@bibliotheca-dao/ui-lib';
import Image from 'next/image';
import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { COMBAT_OUTCOME_ATTACKER_WINS } from '@/constants/troops';
import type { GetRealmCombatResultQuery } from '@/generated/graphql';
import { useGetRealmCombatResultQuery } from '@/generated/graphql';
import useTxCallback from '@/hooks/useTxCallback';
import { resourcePillaged } from '@/shared/Getters/Realm';
import { Troop } from '@/shared/squad/Troops';
import type { TroopInterface } from '@/types/index';

export const CombatTroop = (props: TroopInterface) => {
  return <div>{props.vitality}</div>;
};

export const RaidResults = ({ defendId, tx }) => {
  const { tx: txCallback, loading } = useTxCallback(tx, (status) => {
    // Update state changes?
    console.log(loading);
    console.log(status);
    console.log(txCallback);
    if (status !== 'REJECTED') {
      console.log('rejected');
    }
  });
  // Sample combat result query
  const {
    data: combatResult,
    startPolling,
    stopPolling,
  } = useGetRealmCombatResultQuery({
    variables: {
      defendRealmId: defendId,
      transactionHash: tx,
    },
  });
  useEffect(() => {
    startPolling(2000); // TODO poll interval after transaction accepted on l2
    if (combatResult?.getRealmCombatResult) {
      stopPolling();
    }
    console.log(combatResult);
    return () => {
      stopPolling();
    };
  }, [combatResult, startPolling, stopPolling]);

  const getCombatSteps = () => {
    return combatResult?.getRealmCombatResult?.history
      ? combatResult?.getRealmCombatResult?.history?.filter((a) => {
          return a.eventType == 'combat_step';
        })
      : [];
  };

  const success =
    combatResult?.getRealmCombatResult.outcome === COMBAT_OUTCOME_ATTACKER_WINS;

  const getFlatHitpoints = () => {
    return combatResult?.getRealmCombatResult.history?.map((a) => {
      return a.hitPoints;
    });
  };

  console.log(getFlatHitpoints());
  return (
    <div className="pt-10">
      {/* <div className="flex justify-between space-x-3">
        <div>
          {combatResult?.getRealmCombatResult.history?.slice(1).map((a, i) => {
            return (
              <div className="p-2 border mb-2l" key={i}>
                {i % 2 == 0 ? (
                  <div>
                    HIT: {a.hitPoints}
                    {a.attackSquad.map((c, index) => {
                      return (
                        <BattleTroop
                          key={index}
                          hitsTaken={index === 0 ? getFlatHitpoints[i - 1] : 0}
                          troopId={c.troopId}
                          vitality={c.vitality}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    DAMAGE: {a.hitPoints}
                    {a.defendSquad.map((c, index) => {
                      return (
                        <BattleTroop
                          key={index}
                          hitsTaken={index === 0 ? getFlatHitpoints[i] : 0}
                          troopId={c.troopId}
                          vitality={c.vitality}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div>
          {combatResult?.getRealmCombatResult.history?.slice(1).map((a, i) => {
            return (
              <div className="p-2 mb-2 border" key={i}>
                {Math.abs(i % 2) != 1 ? (
                  <div>
                    DAMAGE: {a.hitPoints}
                    {a.defendSquad.map((c, i) => {
                      return (
                        <BattleTroop
                          key={i}
                          hitsTaken={i === 0 ? a.hitPoints : 0}
                          troopId={c.troopId}
                          vitality={c.vitality}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    HIT: {a.hitPoints}
                    {a.attackSquad.map((c, i) => {
                      return (
                        <BattleTroop
                          key={i}
                          hitsTaken={i === 0 ? a.hitPoints : 0}
                          troopId={c.troopId}
                          vitality={c.vitality}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div> */}

      <Image
        className="w-full rounded"
        width={500}
        objectFit={'cover'}
        layout="responsive"
        height={250}
        src="/createOrDestroy-desktop.webp"
      />
      {combatResult?.getRealmCombatResult ? (
        <div className="mt-5">
          <h2 className="mb-4">
            {success ? 'Successful' : 'Unsuccessful'} Raid!!
          </h2>
          <h3>Battle report</h3>
          <div className="relative flex flex-wrap ">
            <div className="w-full">
              {getCombatSteps().map((a, index) => {
                return (
                  <BattleReportItem
                    key={index}
                    index={index}
                    realm={
                      index & 1
                        ? combatResult?.getRealmCombatResult.defendRealmId
                        : combatResult?.getRealmCombatResult.attackRealmId
                    }
                    hitPoints={a.hitPoints}
                    result={combatResult?.getRealmCombatResult}
                  />
                );
              })}
            </div>
          </div>

          {combatResult?.getRealmCombatResult.resourcesPillaged?.length ? (
            <div className="pt-4">
              <div className="mb-4 text-3xl">
                Hurray!! You slayed all of Realm{' '}
                {combatResult?.getRealmCombatResult.defendRealmId} troops and
                took off with the following resources. The citizens are
                trembling and in awe of your victory.
              </div>
              <div className="flex justify-center w-72">
                {resourcePillaged(
                  combatResult?.getRealmCombatResult.resourcesPillaged
                )}
              </div>
              {(combatResult?.getRealmCombatResult?.relicLost ?? 0) > 0 && (
                <div className="flex pl-10 text-xl uppercase w-72">
                  Relic {combatResult?.getRealmCombatResult.relicLost}
                </div>
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      ) : (
        <div className="p-10">
          <div className="text-3xl ">Running on-chain battle simulation...</div>

          <p className="mt-2 text-xl">
            Your army is on route to the enemy and your general will report back
            very soon.
          </p>
        </div>
      )}
    </div>
  );
};

interface BattleReportItem {
  realm: number;
  index: number;
  hitPoints: number | null | undefined;
  result: GetRealmCombatResultQuery['getRealmCombatResult'];
}

export function BattleReportItem(props: BattleReportItem): ReactElement {
  const isOwnRealm = props.index & 1 ? false : true;

  return (
    <div
      className={`flex justify-between w-full px-4 py-1 my-1 text-2xl border-4 border-double rounded shadow-inner border-white/30 font-display ${
        isOwnRealm ? 'bg-green-900' : 'bg-red-900'
      }`}
    >
      {' '}
      <span>
        <span>
          {props.index + 1}. Your troops {isOwnRealm ? 'dealt' : 'took'}{' '}
          <span className="font-semibold">{props.hitPoints}</span> damage
        </span>
      </span>
    </div>
  );
}

interface BattleTroopItem {
  vitality: number;
  troopId: number;
  hitsTaken: number | null | undefined;
}

export function BattleTroop(props: BattleTroopItem): ReactElement {
  return (
    <div className="w-24">
      {' '}
      <span>
        <span>
          ID: {props.troopId} {props.vitality} {props.hitsTaken}
        </span>
      </span>
    </div>
  );
}
