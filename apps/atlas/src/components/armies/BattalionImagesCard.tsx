import Image from 'next/image';
import { battalionInformation, getUnitImage } from '@/constants/army';
import type { Army } from '@/generated/graphql';
import type { ArmyAndOrder } from '@/hooks/settling/useArmy';

type Prop = {
  battalion: ArmyAndOrder;
  endBattalion?: Army;
};
interface HealthBarProps {
  health: number;
  troopId: number;
  baseHealth: number;
  className?: string;
}
export const HealthBar = (props: HealthBarProps) => {
  const getVitality = () => {
    return (props.health / props.baseHealth) * 100;
  };

  const getColour = () => {
    const vit = getVitality();
    if (vit >= 100) {
      return 'bg-green-700/60 ';
    } else if (vit > 70) {
      return 'bg-green-800/70 ';
    } else if (vit > 50) {
      return 'bg-yellow-600/60 ';
    } else if (vit > 25) {
      return 'bg-red-200/60 ';
    } else {
      return 'bg-red-500/60 ';
    }
  };

  return (
    <div
      className={`absolute bottom-0 flex h-full transform rotate-180 ${props.className}`}
    >
      <div
        style={{
          height: `${getVitality() > 100 ? 100 : getVitality()}%`,
        }}
        className={`${getColour()} transform w-2  border border-white/30`}
      ></div>
    </div>
  );
};
export const BattalionImagesCard: React.FC<Prop> = (props) => {
  return (
    <>
      {battalionInformation.map((unit) => {
        return (
          <>
            {props.battalion[unit.name + 'Qty'] > 0 && (
              <div key={unit.id} className="relative h-32">
                <Image
                  alt={unit.name}
                  src={getUnitImage(unit.id)}
                  layout="fill"
                  objectFit="cover"
                />
                <HealthBar
                  troopId={unit.id}
                  health={props.battalion[unit.name + 'Health']}
                  baseHealth={100} // TODO add base amount of health (unit health * qty)
                />
                <div className="relative flex flex-col justify-end w-full h-full">
                  <div>
                    <p className="bottom-0 right-0 pr-2 text-2xl font-bold text-right ">
                      {props.battalion[unit.name + 'Qty']}x
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })}
    </>
  );
};
