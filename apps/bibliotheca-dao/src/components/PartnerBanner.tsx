import Cartridge from '@bibliotheca-dao/ui-lib/icons/cartridge.svg';
import Starkware from '@bibliotheca-dao/ui-lib/icons/starkware.svg';
export const PartnerBanner = () => {
  const partners = [
    {
      icon: <Starkware className="w-48" />,
      url: 'https://starkware.co/starknet/',
    },
    {
      icon: <Cartridge className="w-48" />,
      url: 'https://starkware.co/starknet/',
    },
    {
      icon: <h2 className="text-orange-600">Briq</h2>,
      url: 'https://briq.construction',
    },
  ];
  return (
    <div className="relative z-20 flex justify-center w-full h-48 p-20 space-x-10 text-gray-900 shadow-inner bg-off-300/40">
      <h4>Working with</h4>{' '}
      {partners.map((a, index) => {
        return (
          <div key={index} className="self-center">
            {' '}
            <a href={a.url}>{a.icon}</a>{' '}
          </div>
        );
      })}
    </div>
  );
};
