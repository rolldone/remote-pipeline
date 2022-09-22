import net from "net"

const PortFree = function getPortFree(): Promise<number> {
  return new Promise(res => {
    const srv = net.createServer() as any;
    srv.listen(0, () => {
      const port = srv.address().port
      srv.close((err) => res(port))
    });
  })
}

export default PortFree;