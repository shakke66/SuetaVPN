import { getTariff } from './tariffs';

const tariff = getTariff('base');

if (tariff) {
  // @ts-expect-error The public tariff catalog must be deeply readonly.
  tariff.devices = 99;
  // @ts-expect-error Nested traffic configuration must also be readonly.
  tariff.traffic.kind = 'bypass';
}
